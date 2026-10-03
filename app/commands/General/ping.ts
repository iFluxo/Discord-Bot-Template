import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Declare, Embed, MessageFlags } from "seyfert";

import { colors } from "#config";

/**
 * Reports gateway, database, and round-trip runtime latency.
 */
@Declare({
    name: "ping",
    aliases: [],
    description: "ping.description",
    contexts: ["Guild", "BotDM"],
    integrationTypes: ["GuildInstall", "UserInstall"],
    botPermissions: ["EmbedLinks"],
    props: {
        category: "General",
    },
})
@Cooldown.user(1_000)
export default class PingCommand extends Command {
    async run(ctx: CommandContext) {
        const translate = ctx.t.get();

        /*
         * Fall back to message timestamp and then wall-clock time so the
         * runtime latency figure remains meaningful across interaction types.
         */
        const ping = ctx.client?.gateway?.latency;
        const pong = ctx.interaction?.createdTimestamp ?? ctx.message?.createdTimestamp ?? Date.now();
        const dbPing = await ctx.db.ping();

        const embed = new Embed().setColor(colors.Primary).addFields(
            {
                name: translate.ping.client.title,
                value: translate.ping.client.value(ping),
                inline: true,
            },
            {
                name: translate.ping.database.title,
                value: translate.ping.database.value(dbPing.latency),
                inline: true,
            },
            {
                name: translate.ping.runtime.title,
                value: translate.ping.runtime.value(Date.now() - pong),
                inline: true,
            },
        );

        await ctx.editOrReply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
        });
    }
}
