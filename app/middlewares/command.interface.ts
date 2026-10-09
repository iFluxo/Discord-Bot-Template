import { type CommandContext, createMiddleware } from "seyfert";

import { setLocale } from "#utils/function";

export const commandInterface = createMiddleware<void, CommandContext>(async ({ context, next, stop }) => {
    if (context.command.props?.onlyForDev && !context.config.config.Developers.includes(context.author.id)) return stop();

    if (context.guildId) {
        const locale = await context.db.getLocale(context.guildId);

        setLocale(context.guildId, locale);

        Object.defineProperty(context, "t", {
            configurable: true,
            value: context.client.t(locale),
        });
    }

    context.client.logger.info(
        `${context.author.username} (${context.author.id}) used /${context?.resolver?.fullCommandName} in ${(await context.guild())?.name}`,
    );
    return next();
});
