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
import { generateCases } from "#plugins/function";

const clientOptions = {
    context: extendContext(() => ({ config, readyAt: Math.round(Date.now() / 1000) })),
    allowedMentions: {
        parse: ["everyone", "roles", "users"] as ("everyone" | "roles" | "users")[],
        replied_user: false,
    },
    commands: {
        prefix: async (message: { content: string, guildId?: string | null; client: unknown }) => {
            const guildId = message?.guildId;
            const { CommandPrefixs } = config.config;

            if (message.content === message.client?.me?.toString()) {
                return message.react("👋🏻");
            }
            if (guildId) {
                CommandPrefixs.push(message.client?.me?.toString());
                try {
                    const customPrefixs = await (
                        message.client as {
                            db: {
                                getPrefix: (id: string) => Promise<string[]>;
                            };
                        }
                    ).db.getPrefix(guildId);
                    if (customPrefixs) return customPrefixs.flatMap((p) => generateCases(p));
                } catch {
                    await (
                        message.client as {
                            db: {
                                setPrefix: (id: string, prefixs: string[]) => Promise<string[]>;
                            };
                        }
                    ).db.setPrefix(guildId, [...new Set([...CommandPrefixs])]);

                    return CommandPrefixs.flatMap((p) => generateCases(p));
                }
            }

            return CommandPrefixs.flatMap((p) => generateCases(p));
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
    presence: (shardId: number) => ({
        status: PresenceUpdateStatus.Online,
        activities: [
            {
                name: "Custom Status",
                state: "Ultra Fast 🚀 with Bun & TypeScript 7",
                type: ActivityType.Custom,
            },
            {
                name: `Total ${shardId} shard!`,
                type: ActivityType.Watching,
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
            .catch((error: unknown) => {
                this.logger.fatal(error);
                process.exit(1);
            });
    }
}

export { CustomClient as Client, clientOptions };
