import {
    Client,
    type CommandContext,
    type ComponentContext,
    extendContext,
    type MenuCommandContext,
    type MessageCommandInteraction,
    MessageFlags,
    type ModalContext,
    type PermissionStrings,
    type UserCommandInteraction,
} from "seyfert";
import { ActivityType, PresenceUpdateStatus } from "seyfert/lib/types";
import * as config from "#config";
import { generateCases } from "#utils/function";

type PrefixMessage = {
    content: string;
    guildId?: string | null;
    client: unknown;
    react?: (emoji: string) => unknown;
};

const clientOptions = {
    context: extendContext(() => ({ config, readyAt: Math.round(Date.now() / 1000) })),
    allowedMentions: {
        parse: [] as ("everyone" | "roles" | "users")[],
        replied_user: false,
    },
    commands: {
        prefix: async (message: PrefixMessage) => {
            const guildId = message.guildId;
            const clientConfig = (message.client as { config?: { config?: { CommandPrefixs: string[] } } }).config;
            let CommandPrefixs: string[] = clientConfig?.config?.CommandPrefixs ?? [];
            const meMention = (message.client as { me?: { toString(): string } | null }).me?.toString() ?? CommandPrefixs[0];
            const meUsername = (message.client as { username?: string | null }).username?.toLowerCase() ?? CommandPrefixs[0];

            if (message.content === meMention) {
                (message as { react?: (emoji: string) => unknown }).react?.("👋🏻");
                return CommandPrefixs;
            }
            if (guildId) {
                try {
                    let customPrefixs = await (
                        message.client as {
                            db: {
                                getPrefix: (id: string) => Promise<string[]>;
                            };
                        }
                    ).db.getPrefix(guildId);
                    if (customPrefixs) {
                        customPrefixs = customPrefixs.flatMap((p) => generateCases(p));
                        customPrefixs.push(meMention, meUsername);
                        return customPrefixs;
                    }
                } catch {
                    await (
                        message.client as {
                            db: {
                                setPrefix: (id: string, prefixs: string[]) => Promise<string[]>;
                            };
                        }
                    ).db.setPrefix(guildId, [...new Set([...CommandPrefixs])]);

                    CommandPrefixs = CommandPrefixs.flatMap((p) => generateCases(p));
                    CommandPrefixs.push(meMention, meUsername);
                    return CommandPrefixs;
                }
            }

            CommandPrefixs = CommandPrefixs.flatMap((p) => generateCases(p));
            CommandPrefixs.push(meMention, meUsername);
            return CommandPrefixs;
        },
        reply: () => true,
        deferReplyResponse: () => ({ content: "Sending request..." }),
        defaults: {
            props: {
                onlyForAdmin: false,
                onlyForDev: false,
                disabled: false,
            },
            onRunError: (
                context: CommandContext | MenuCommandContext<MessageCommandInteraction | UserCommandInteraction>,
                error: unknown,
            ) => {
                context.editOrReply({
                    content: "Something went wrong!",
                    flags: MessageFlags.Ephemeral,
                });
                context.client.logger.error(error);
            },
            onOptionsError: (context: CommandContext) => {
                context.editOrReply({
                    content: "Invalid options provided.",
                    flags: MessageFlags.Ephemeral,
                });
            },
            onPermissionsFail: (context: CommandContext, permissions: PermissionStrings) => {
                context.editOrReply({
                    content: `You need ${permissions.join(", ")} permissions to use this command.`,
                    flags: MessageFlags.Ephemeral,
                });
            },
            onBotPermissionsFail: (
                context: CommandContext | MenuCommandContext<MessageCommandInteraction | UserCommandInteraction>,
                permissions: PermissionStrings,
            ) => {
                context.editOrReply({
                    content: `I need ${permissions.join(", ")} permissions to run this command.`,
                    flags: MessageFlags.Ephemeral,
                });
            },
            onMiddlewaresError: async (
                context: CommandContext | MenuCommandContext<MessageCommandInteraction | UserCommandInteraction>,
                error: string,
            ) => {
                const result = await context?.cooldown?.consume();
                context.editOrReply({ content: error, flags: MessageFlags.Ephemeral });
                if (!context.interaction) {
                    const rms = result?.remainingMs ?? 3000;
                    setTimeout(() => context.deleteResponse(), rms < 3000 ? rms + 5000 : rms);
                }
            },
            onInternalError: (client: Client<true>, error: unknown) => {
                client.logger.fatal(error);
            },
        },
    },
    components: {
        defaults: {
            onRunError: (context: ComponentContext) => {
                context.editOrReply({
                    content: "Component error!",
                    flags: MessageFlags.Ephemeral,
                });
            },
        },
    },
    modals: {
        defaults: {
            onRunError: (context: ModalContext) => {
                context.editOrReply({
                    content: "Modal error!",
                    flags: MessageFlags.Ephemeral,
                });
            },
        },
    },
    presence: (_shardId: number) => ({
        status: PresenceUpdateStatus.Online,
        activities: [
            {
                name: "Custom Status",
                state: "Ultra Fast 🚀 Powered by Seyfert",
                type: ActivityType.Custom,
            },
        ],
        since: Date.now(),
        afk: false,
    }),
};

class CustomClient extends Client<true> {
    declare config: typeof config;

    constructor(extendedOptions = {}) {
        super({
            ...clientOptions,
            ...extendedOptions,
        });

        this.config = config;

        this.start()
            .then(() => this.uploadCommands())
            .catch((error) => this.logger.fatal(error));
    }
}

export { CustomClient as Client, clientOptions };
