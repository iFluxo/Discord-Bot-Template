import {
  Declare,
  Command,
  type CommandContext,
	Button,
	Container,
	Section,
	Separator,
	TextDisplay,
	ButtonStyle,
	MessageFlags
} from "seyfert";

import { Cooldown } from "@slipher/cooldown";

@Declare({
  name: "kontainer",
  aliases: [],
  description: "Send kontainer",
  contexts: ["Guild"],
  integrationTypes: ["GuildInstall"],
  botPermissions: ["EmbedLinks"],
})
@Cooldown.user(3_000)

export default class KontainerCommand extends Command {
  async run(ctx: CommandContext) {
const components = new Container().addComponents(
	new TextDisplay().setContent(
		"## Introducing New Components for Messages!\nWe're bringing new components to messages that you can use in your apps. They allow you to have full control over the layout of your messages.\n\nOur previous components system, while functional, had limitations:\n- Content, attachments, embeds, and components had to follow fixed positioning rules\n- Visual styling options were limited\n\nOur new component system addresses these challenges with fully composable components that can be arranged and laid out in any order, allowing for a more flexible and visually appealing design. Check out the [changelog](https://discord.com/developers/docs/change-log) for more details.",
	),
	new Section()
		.setComponents(
			new TextDisplay().setContent("### A brief overview of components:"),
		)
		.setAccessory(
			new Button()
				.setCustomId("overview")
				.setStyle(ButtonStyle.Success)
				.setLabel("Overview")
		),
	new Section()
		.setComponents(
			new TextDisplay().setContent("### Biasa\n`a`,`bc`,`cde`"),
		)
		.setAccessory(
			new Button()
				.setCustomId("biasa")
				.setStyle(ButtonStyle.Primary)
				.setLabel("Perintah Biasa")
		),

	new Section()
		.setComponents(
			new TextDisplay().setContent("### Get started with message components:"),
		)
		.setAccessory(
			new Button()
				.setCustomId("guide")
				.setStyle(ButtonStyle.Secondary)
				.setLabel("Guide")
		),
	new Separator(),
	new TextDisplay().setContent(
		"-# This message was composed using components, check out the request:",
	),
);

ctx.write({ components: [components], flags: MessageFlags.IsComponentsV2 });
  }
}