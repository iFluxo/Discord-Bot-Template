import {
    Declare,
    Command,
    Options,
    createStringOption,
    type CommandContext,
    Embed,
} from "seyfert";
import { Cooldown } from "@slipher/cooldown";

import { colors } from "#data";

@Declare({
    name: "help",
    aliases: ["h"],
    description: "Display commands list and usage helper.",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
    botPermissions: ["EmbedLinks"],
    props: {
        category: "General"
    },
})
@Cooldown.user(10_000)
@Options({
    command: createStringOption({
        description: `Input command name.`
    })
})

export default class HelpCommand extends Command {
    async run(ctx: CommandContext) {
        if (ctx.options?.command?.length) helpCommand(ctx);
        else commandsList(ctx);
  }
}

async function helpCommand(ctx: CommandContext) {
    const embed = new Embed()
        .setColor(colors.Primary)
        .setTitle("Help Command")
    ctx.write({ embeds: [embed] });
}

async function commandsList(ctx: CommandContext) {
    const embed = new Embed()
        .setColor(colors.Primary)
        .setTitle("Commands List");
    ctx.write({ embeds: [embed] });
}