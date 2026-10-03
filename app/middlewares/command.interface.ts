import { createMiddleware } from "seyfert";

export const commandInterface = createMiddleware<void>(
    ({ context, next }) => {
        if (context.command.props?.botDeveloperOnly && !context.config.Developers.includes(context.author.id)) return;
        context.client.logger.info(`${context.author.username} (${context.author.id}) used /${context?.resolver?.fullCommandName}`);
        next({ createdAt: new Date(), createdTimestamp: Date.now() });
    }
);