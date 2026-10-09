import { type CommandContext, createMiddleware } from "seyfert";

export const commandInterface = createMiddleware<void, CommandContext>(async ({ context, next }) => {
    if (context.command.props?.onlyForDev && !context.config.config.Developers.includes(context.author.id)) return;
    context.client.logger.info(
        `${context.author.username} (${context.author.id}) used /${context?.resolver?.fullCommandName} in ${(await context.guild())?.name}`,
    );
    return next();
});
