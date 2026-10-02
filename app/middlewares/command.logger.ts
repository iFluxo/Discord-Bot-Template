import { createMiddleware } from "seyfert";

export const commandLogger = createMiddleware<void>(
    ({ context, next }) => {
        context.client.logger.info(`${context.author.username} (${context.author.id}) used /${context?.resolver?.fullCommandName}`);
        next();
    }
);