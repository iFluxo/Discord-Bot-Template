import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createStringOption, Declare, Embed, MessageFlags, Options } from "seyfert";

import { colors } from "#config";

const languageOptions = {
    locale: createStringOption({
        description: "Language code to set. Leave empty to view current.",
        required: false,
    }),
};

@Declare({
    name: "language",
    aliases: ["lang"],
    description: "View or change the bot language for this server.",
    defaultMemberPermissions: ["ManageGuild"],
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
    botPermissions: ["EmbedLinks"],
})
@Cooldown.user(3_000)
@Options(languageOptions)
export default class LanguageCommand extends Command {
    async run(ctx: CommandContext<typeof languageOptions>) {
        const guildId = ctx.guildId;

        if (!guildId) {
            return await ctx.editOrReply({
                content: "This command can only be used inside a server.",
                flags: MessageFlags.Ephemeral,
            });
        }

        const available = Object.keys(ctx.client.langs.values);
        const input = ctx.options?.locale?.trim();

        if (!input) {
            const current = await ctx.db.getLocale(guildId);

            return await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setColor(colors.Primary)
                        .setTitle("Current Language")
                        .setDescription(`\`${current}\`\n\nAvailable: ${available.map((locale) => `\`${locale}\``).join(", ")}`),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        const resolved = available.find((locale) => locale.toLowerCase() === input.toLowerCase());

        if (!resolved) {
            return await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setColor("Red")
                        .setDescription(
                            `\`❌\` Language \`${input}\` is not supported.\nAvailable: ${available.map((locale) => `\`${locale}\``).join(", ")}`,
                        ),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        const updated = await ctx.db.setLocale(guildId, resolved);

        await ctx.editOrReply({
            embeds: [new Embed().setColor(colors.Primary).setDescription(`✅ Language has been set to \`${updated}\`.`)],
            flags: MessageFlags.Ephemeral,
        });
    }
}
