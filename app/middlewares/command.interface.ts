import { type CommandContext, createMiddleware } from "seyfert";

/**
 * Audit middleware that records every command invocation and blocks
 * developer-only commands from non-developer users.
 */
export const commandInterface = createMiddleware<void, CommandContext>(async ({ context, next }) => {
    if (context.command.props?.onlyForDev && !context.config.config.Developers.includes(context.author.id)) return;
    context.client.logger.info(
        `${context.author.username} (${context.author.id}) used /${context?.resolver?.fullCommandName} in ${(await context.guild())?.name}`,
    );
    next();
});
