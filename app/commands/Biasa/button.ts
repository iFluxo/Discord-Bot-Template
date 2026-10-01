import {
  Declare,
  Command,
  type CommandContext,
  ActionRow,
  Button,
  ButtonStyle,
} from "seyfert";
import { Cooldown } from "@slipher/cooldown";

@Declare({
  name: "button",
  aliases: [],
  description: "Create Button",
  contexts: ["Guild"],
  integrationTypes: ["GuildInstall"],
  botPermissions: ["EmbedLinks"],
})
@Cooldown.user(3_000)

export default class ButtonCommand extends Command {
  async run(ctx: CommandContext) {
    const row = new ActionRow()
      .setComponents([
        new Button().setCustomId('testbutton').setEmoji('👍🏻').setLabel('1234').setStyle(ButtonStyle.Primary)
      ])
    await ctx.write({
      components: [row]
    });
  }
}