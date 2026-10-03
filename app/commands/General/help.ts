import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createStringOption, Declare, Embed, Options } from "seyfert";

import { colors } from "#config";

/**
 * Command options for the help command.
 */
const helpOptions = {
    command: createStringOption({
        description: "help.options.command",
    }),
};

/**
 * Displays the full command list, or targeted information about a single
 * command when a command name is provided.
 */
@Declare({
    name: "help",
    aliases: ["h"],
    description: "help.description",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
    botPermissions: ["EmbedLinks"],
    props: {
        category: "help.category",
    },
})
@Cooldown.user(3_000)
@Options(helpOptions)
export default class HelpCommand extends Command {
    async run(ctx: CommandContext<typeof helpOptions>) {
        /*
         * Route to a detail view when the user names a command, otherwise
         * render the aggregate command list.
         */
        if (ctx.options?.command?.length) helpSpesific(ctx);
        else commandsList(ctx);
    }
}

/**
 * Replies with localized information about a specific command.
 *
 * @param ctx The command context used to resolve the current locale.
 */
async function helpSpesific(ctx: CommandContext) {
    const cmdToSearch = ctx.options.command;

    const embed = new Embed()
        .setColor(colors.Secondary)
        .setDescription(`*Searching command with name \`${cmdToSearch}\`...*`);

    await ctx.editOrReply({ embeds: [embed] });

    const translate = ctx.t.get();

    const commands = ctx.client.commands.values();

    const commandOwned = commands.find(cmd => cmd.name === cmdToSearch) ?? commands.find(cmd => cmd.aliases.includes(cmdToSearch));

    if (!commandOwned) return ctx.editOrReply({ embeds: [embed.setColor("Red").setDescription(`Command with name \`${cmdToSearch}\` is not found.`)] })

    embed.setColor(colors.Primary)
        .setTitle(commandOwned.name)
        .setDescription(`*${translate[commandHas.name].description}*`)
        .setFooter({ text: translate[commandOwned.name].category });
    if (commandOwned.aliases?.length > 0) embed.setAuthor({ name: `( ${commandOwned.map(n => n).join(", ")} )` });

    ctx.write({ embeds: [embed] });
}

/**
 * Replies with the localized overview of all available commands.
 *
 * @param ctx The command context used to resolve the current locale.
 */
async function commandsList(ctx: CommandContext) {
    const translate = ctx.t.get();
    const embed = new Embed().setColor(colors.Primary).setTitle(translate.help.list.title).setDescription(translate.help.list.description);
    ctx.write({ embeds: [embed] });
}
