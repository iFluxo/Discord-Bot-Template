import {
    Declare,
    Command,
    type CommandContext,
    Embed,
    MessageFlags,
} from "seyfert";
import { Cooldown } from "@slipher/cooldown";

import { colors } from "#config";

@Declare({
    name: "ping",
    aliases: [],
    description: "ping.description",
    contexts: ["Guild", "BotDM"],
    integrationTypes: ["GuildInstall","UserInstall"],
    botPermissions: ["EmbedLinks"],
    props: {
        category: "ping.category"
    },
})
@Cooldown.user(1_000)

export default class PingCommand extends Command {
    async run(ctx: CommandContext) {
        const translate = ctx.t.get();

        const ping = ctx.client?.gateway?.latency;
        const pong = ctx.globalMetadata.commandInterface?.createdTimestamp ?? Date.now();
        const dbPing = await ctx.db.ping("mongodb");

        const embed = new Embed()
            .setColor(colors.Primary)
            .addFields({
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
            });

        await ctx.editOrReply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
  }
}