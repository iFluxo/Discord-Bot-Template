import { Client, MessageFlags } from "seyfert";
import { ActivityType, PresenceUpdateStatus } from "seyfert/lib/types";

import { config } from "#data";

const clientOptions = {
    allowedMentions: {
        parse: ["everyone", "roles", "users"],
        replied_user: false
    },
    commands: {
        prefix: (message) => config.cmdPrefix,
        reply: (ctx) => true,
        deferReplyResponse: (ctx) => ({ content: "Sending request..." }),
        defaults: {
            props: {
                botAdminOnly: false,
                botDeveloperOnly: false,
                disabled: false,
                category: "none"
            },
            onRunError: (context, error) => {
                context.editOrReply({ content: 'Something went wrong!', flags: MessageFlags.Ephemeral });
                context.client.logger.error(error);
            },
            onOptionsError: (context) => {
                context.editOrReply({ content: 'Invalid options provided.', flags: MessageFlags.Ephemeral });
            },
            onPermissionsFail: (context, permissions) => {
                context.editOrReply({ content: `You need ${permissions.join(', ')} permissions to use this command.`, flags: MessageFlags.Ephemeral });
            },
            onBotPermissionsFail: (context, permissions) => {
                context.editOrReply({ content: `I need ${permissions.join(', ')} permissions to run this command.`, flags: MessageFlags.Ephemeral });
            },
            onMiddlewaresError: async (context, error) => {
                const result = await context.cooldown.consume();
                context.editOrReply({ content: error, flags: MessageFlags.Ephemeral });
                if (!context.interaction) {
                    setTimeout(() => context.deleteResponse(), result.remainingMs < 3000 ? result.remainingMs + 5000 : result.remainingMs);
                }
            },
            onInternalError: (client, error) => {
                client.logger.fatal(error);
            },
        },
    },
    components: {
        defaults: {
            onRunError: (context, error) => {
                context.editOrReply({ content: 'Component error!', flags: MessageFlags.Ephemeral });
            },
        },
    },
    modals: {
        defaults: {
            onRunError: (context, error) => {
                context.editOrReply({ content: 'Modal error!', flags: MessageFlags.Ephemeral });
            },
        },
    },
    gateway: {
        properties: {
            os: "android",
            browser: "Discord Android",
            device: "android"
        }
    },
    presence: (shardId) => ({
        status: PresenceUpdateStatus.Online,
        activities: [{
            name: "Custom Status",
            state: "Fight! ⚔️💥🔥",
            type: ActivityType.Custom,
        }],
        since: Date.now(),
        afk: false,
    }),
};

class CustomClient extends Client<true> {
    constructor(extendedOptions={}) {
        super({
            ...clientOptions,
            ...extendedOptions
        });

        this.start().then(
            _ => this.uploadCommands()
        );
    }
}

export { CustomClient as Client }
