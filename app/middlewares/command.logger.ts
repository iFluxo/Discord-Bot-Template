import { createMiddleware, type MiddlewareContext } from "seyfert";

export const commandLogger = createMiddleware<void>(
    (middle: MiddlewareContext) => {
        middle.context.client.logger.info(`${middle.context.author.username} (${middle.context.author.id}) used /${middle.context.resolver.fullCommandName}`);
        middle.next();
    }
);