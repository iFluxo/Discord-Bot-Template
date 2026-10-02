import { Client, type CommandContext, type MenuCommandContext, MessageFlags, PermissionStrings } from "seyfert";
import { config } from "#data";

const clientOptions = {
    allowedMentions: {
        parse: ["everyone", "roles", "users"],
        replied_user: false
    },
    commands: {
        prefix: () => config.cmdPrefixs,
        reply: () => true,
        deferReplyResponse: () => ({ content: "Sending request..." }),
        defaults: {
            props: {
                botAdminOnly: false,
                botDeveloperOnly: false,
                disabled: false,
                category: "none"
            },
            onRunError: (context: CommandContext | MenuCommandContext, error: unknown) => {
                context.editOrReply({ content: 'Something went wrong!', flags: MessageFlags.Ephemeral });
                context.client.logger.error(error);
            },
            onOptionsError: (context: CommandContext) => {
                context.editOrReply({ content: 'Invalid options provided.', flags: MessageFlags.Ephemeral });
            },
            onPermissionsFail: (context: CommandContext, permissions: PermissionStrings) => {
                context.editOrReply({ content: `You need ${permissions.join(', ')} permissions to use this command.`, flags: MessageFlags.Ephemeral });
            },
            onBotPermissionsFail: (context: CommandContext, permissions: PermissionStrings) => {
                context.editOrReply({ content: `I need ${permissions.join(', ')} permissions to run this command.`, flags: MessageFlags.Ephemeral });
            },
            onMiddlewaresError: async (context: CommandContext, error: string) => {
                const result = await context?.cooldown?.consume();
                context.editOrReply({ content: error, flags: MessageFlags.Ephemeral });
                if (!context.interaction) {
                    let rms = result?.remainingMs ?? 3000;
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
            onRunError: (context: CommandContext) => {
                context.editOrReply({ content: 'Component error!', flags: MessageFlags.Ephemeral });
            },
        },
    },
    modals: {
        defaults: {
            onRunError: (context: CommandContext) => {
                context.editOrReply({ content: 'Modal error!', flags: MessageFlags.Ephemeral });
            },
        },
    },
};

class CustomClient extends Client<true> {
    constructor(extendedOptions={}) {
        super({
            ...clientOptions,
            ...extendedOptions
        });

        this.start().then(
            () => this.uploadCommands()
        );
    }
}

export { CustomClient as Client, clientOptions }
