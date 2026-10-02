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
    description: "help.description",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
    botPermissions: ["EmbedLinks"],
    props: {
        category: "help.category"
    },
})
@Cooldown.user(10_000)
@Options({
    command: createStringOption({
        description: "help.options.command"
    })
})

export default class HelpCommand extends Command {
    async run(ctx: CommandContext) {
        if (ctx.options?.command?.length) helpSpesific(ctx);
        else commandsList(ctx);
  }
}

async function helpSpesific(ctx: CommandContext) {
    const translate = ctx.t.get();
    
    const embed = new Embed()
        .setColor(colors.Secondary)
        .setTitle(translate.help.spesific.title)
        .setDescription(translate.help.spesific.description
        )
    ctx.write({ embeds: [embed] });
}

async function commandsList(ctx: CommandContext) {
    const translate = ctx.t.get();
    
    const embed = new Embed()
        .setColor(colors.Primary)
        .setTitle(translate.help.list.title)
        .setDescription(translate.help.list.description);
    ctx.write({ embeds: [embed] });
}