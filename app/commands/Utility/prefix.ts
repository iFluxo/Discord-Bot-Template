import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createStringOption, Declare, Embed, MessageFlags, Options } from "seyfert";

import { colors, config } from "#config";

const prefixOptions = {
    prefixs: createStringOption({
        description: "New prefixes separated by spaces. Leave empty to view current. Use 'default' to reset.",
        required: false,
    }),
};

@Declare({
    name: "prefix",
    aliases: [],
    description: "View, set or reset the command prefix for this server.",
    defaultMemberPermissions: ["ManageGuild"],
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
    botPermissions: ["EmbedLinks"],
})
@Cooldown.user(3_000)
@Options(prefixOptions)
export default class PrefixCommand extends Command {
    async run(ctx: CommandContext<typeof prefixOptions>) {
        const guildId = ctx.guildId;

        if (!guildId) {
            return await ctx.editOrReply({
                content: "This command can only be used inside a server.",
                flags: MessageFlags.Ephemeral,
            });
        }

        const input = ctx.options?.prefixs?.trim();

        if (!input) {
            const current = await ctx.db.getPrefix(guildId);

            return await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setColor(colors.Primary)
                        .setTitle("Current Prefixes")
                        .setDescription(current.map((prefix) => `\`${prefix}\``).join(", ")),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        if (input.toLowerCase() === "default" || input.toLowerCase() === "reset") {
            const reseted = await ctx.db.setPrefix(guildId, config.CommandPrefixs);

            return await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setColor(colors.Primary)
                        .setDescription(`✅ Prefix has been reset to: ${reseted.map((prefix) => `\`${prefix}\``).join(", ")}`),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        const prefixs = [...new Set(input.split(/\s+/).filter((prefix) => prefix.length > 0))];

        if (!prefixs.length || prefixs.length > 10 || prefixs.some((prefix) => prefix.length > 5)) {
            return await ctx.editOrReply({
                embeds: [new Embed().setColor("Red").setDescription("`❌` Provide 1-10 unique prefixes, each at most 5 characters long.")],
                flags: MessageFlags.Ephemeral,
            });
        }

        const updated = await ctx.db.setPrefix(guildId, prefixs);

        await ctx.editOrReply({
            embeds: [
                new Embed()
                    .setColor(colors.Primary)
                    .setDescription(`✅ Prefix has been updated to: ${updated.map((prefix) => `\`${prefix}\``).join(", ")}`),
            ],
            flags: MessageFlags.Ephemeral,
        });
    }
}
