import os from "node:os";
import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Declare, Embed } from "seyfert";
import { formatMemoryUsage } from "seyfert/lib/common/it/logger";

import { colors } from "#config";

@Declare({
    name: "stats",
    aliases: ["st"],
    description: "Showing about bot statistics.",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
    botPermissions: ["EmbedLinks"],
})
@Cooldown.user(1_000)
export default class Template extends Command {
    async run(ctx: CommandContext) {
        const { cache, gateway } = ctx.client;
        const memory = process.memoryUsage();

        const embed = new Embed()
            .setColor(colors.Primary)
            .setTitle("Statistics Information")
            .setDescription(ctx.command.description)
            .addFields(
                { name: "🏠 Total Guilds", value: `${cache.guilds?.count() ?? 0}`, inline: true },
                { name: "👥 Total Users", value: `${cache.users?.count() ?? 0}`, inline: true },
                { name: "💬 Total Channels", value: `${cache.channels?.count("*") ?? 0}`, inline: true },
                { name: "🎭 Total Roles", value: `${cache.roles?.count("*") ?? 0}`, inline: true },
                { name: "😀 Total Emojis", value: `${cache.emojis?.count("*") ?? 0}`, inline: true },
                { name: "🧑 Total Members", value: `${cache.members?.count("*") ?? 0}`, inline: true },
                { name: "📚 Total Messages", value: `${cache.messages?.count("*") ?? 0}`, inline: true },
                { name: "⚡ Latency", value: `${gateway.latency} ms`, inline: true },
                { name: "🗄️ Shards", value: `${gateway.totalShards}`, inline: true },
                { name: "🖥️ OS", value: `\`${os.type()}\``, inline: true },
                { name: "📀 Release", value: `\`${os.release()}\``, inline: true },
                { name: "🏗️ Arch", value: `\`${os.platform()}\` \`${os.machine()}\``, inline: true },
                {
                    name: "🧠 CPU",
                    value: `\`${os.cpus()[0]?.model ?? "Unknown"}\` ( \`${os.cpus().length}\` cores )`,
                    inline: true,
                },
                { name: "💾 Memory ( RSS )", value: `\`${formatMemoryUsage(memory.rss)}\``, inline: true },
                { name: "⏱️ Uptime", value: `<t:${ctx.readyAt}:R>`, inline: true },
            );

        await ctx.editOrReply({ embeds: [embed] });
    }
}
