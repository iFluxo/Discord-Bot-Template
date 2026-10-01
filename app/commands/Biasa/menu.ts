import {
  Declare,
  ActionRow,
  Button,
  ButtonStyle,
  StringSelectMenu,
  StringSelectOption,
  Command,
  type CommandContext
} from 'seyfert';
import { Cooldown } from "@slipher/cooldown";

@Declare({
  name: "menu",
  aliases: [],
  description: "Create Select Menu",
  contexts: ["Guild"],
  integrationTypes: ["GuildInstall"],
  botPermissions: ["EmbedLinks"],
})
@Cooldown.user(3_000)

export default class MenuCommand extends Command {
  async run(ctx: CommandContext) {
   
   
    const button = new Button()
      .setCustomId('helloworld')
      .setLabel('Hello World')
      .setStyle(ButtonStyle.Secondary);

    const buttonRow = new ActionRow<Button>().addComponents(button);



    const menu = new StringSelectMenu()
      .setCustomId('select-helloworld')
      .addOption(
        new StringSelectOption().setLabel('Hello').setValue('option_1')
      );

    const menuRow = new ActionRow<StringSelectMenu>().addComponents(menu);

    await ctx.write({ components: [buttonRow, menuRow] });
  }
}