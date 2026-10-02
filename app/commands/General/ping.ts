import {
    Declare,
    Command,
    type CommandContext,
    Embed,
    MessageFlags,
} from "seyfert";
import { Cooldown } from "@slipher/cooldown";

import { config } from "#data";

@Declare({
    name: "ping",
    aliases: [],
    description: "Show client & runtime latency.",
    contexts: ["Guild", "BotDM"],
    integrationTypes: ["GuildInstall","UserInstall"],
    botPermissions: ["EmbedLinks"],
    props: {
        category: "General"
    },
})
@Cooldown.user(5_000)

export default class PingCommand extends Command {
    async run(ctx: CommandContext) {
        const ping = ctx.client.gateway?.latency;
        const pong = (ctx.interaction?.createdTimestamp ?? ctx.message?.createdTimestamp ?? Date.now());

        const embed = new Embed()
            .setColor(config.primaryColor)
            .addFields({
                name: "Client Latency",
                value: `\`${ping} ms\``,
                inline: true
            },
            {
                name: "Runtime Latency",
                value: `\`${Date.now() - pong} ms\``,
                inline: true
            });

        await ctx.editOrReply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
  }
}