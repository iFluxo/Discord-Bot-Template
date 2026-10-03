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

/**
 * Base client options shared by the custom client and tests. Handlers here
 * centralize user-facing error responses instead of scattering them per command.
 */
const clientOptions = {
    context: extendContext(() => ({ config })),
    allowedMentions: {
        parse: ["everyone", "roles", "users"] as ("everyone" | "roles" | "users")[],
        replied_user: false,
    },
    commands: {
        prefix: () => config.config.CommandPrefixs,
        reply: () => true,
        deferReplyResponse: () => ({ content: "Sending request..." }),
        defaults: {
            props: {
                onlyForAdmin: false,
                onlyForDev: false,
                disabled: false,
                category: "none",
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
                /*
                 * Consume the cooldown ticket so repeated triggered attempts still
                 * count against the user, and auto-delete prefix-command error
                 * responses after the remaining cooldown window elapses.
                 */
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
                state: "Made with ❤️ by Surya",
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

/**
 * Application client. Extends Seyfert's client with the shared config,
 * starts the gateway connection, and uploads commands once ready.
 */
class CustomClient extends Client<true> {
    declare config: typeof config;

    constructor(extendedOptions = {}) {
        super({
            ...clientOptions,
            ...extendedOptions,
        });

        this.config = config;

        this.start().then(() => this.uploadCommands());
    }
}

export { CustomClient as Client, clientOptions };
