import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createUserOption, Declare, Embed, MessageFlags, Options } from "seyfert";

import { colors } from "#config";

const avatarOptions = {
    user: createUserOption({
        description: "The user to get the avatar from.",
        required: false,
    }),
};

@Declare({
    name: "avatar",
    aliases: ["av"],
    description: "Showing the user global and guild avatar.",
    contexts: ["Guild", "BotDM"],
    integrationTypes: ["GuildInstall", "UserInstall"],
    botPermissions: ["EmbedLinks"],
})
@Cooldown.user(1_000)
@Options(avatarOptions)
export default class AvatarCommand extends Command {
    async run(ctx: CommandContext<typeof avatarOptions>) {
        const optionUser = ctx.options?.user;

        let user = ctx.author;
        let guildAvatar: string | null = null;

        if (optionUser) {
            if ("user" in optionUser && optionUser.user) {
                user = optionUser.user;
                guildAvatar = optionUser.avatarURL({ exclude: true, size: 1024 });
            } else {
                user = optionUser as typeof ctx.author;
            }
        } else if (ctx.member && "user" in ctx.member) {
            guildAvatar = ctx.member.avatarURL({ exclude: true, size: 1024 });
        }

        const globalAvatar = user.avatarURL({ size: 1024 });

        const embed = new Embed()
            .setColor(colors.Primary)
            .setTitle(`${user.globalName ?? user.name}'s Avatar`)
            .setImage(guildAvatar ?? globalAvatar)
            .setDescription(
                [guildAvatar ? `[Guild Avatar](${guildAvatar})` : "No guild avatar", `[Global Avatar](${globalAvatar})`].join(" | "),
            )
            .setFooter({ text: `ID: ${user.id}` });

        await ctx.editOrReply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
        });
    }
}
