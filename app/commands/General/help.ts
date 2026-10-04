import { readdirSync } from "node:fs";
import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, createStringOption, Declare, Embed, Options } from "seyfert";

import { colors } from "#config";

/**
 * Command options for the help command.
 */
const helpOptions = {
    command: createStringOption({
        description: "Input a command name.",
    }),
};

/**
 * Displays the full command list, or targeted information about a single
 * command when a command name is provided.
 */


@Declare({
    name: "help",
    aliases: ["h"],
    description: "Displaying commands list and usage helper.",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
    botPermissions: ["EmbedLinks"],
    props: {
        category: "General",
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

    ctx.editOrReply({ embeds: [embed] });

    const translate = ctx.t.get();

    const commands = ctx.client.commands.values.filter(cmd => !cmd.props.onlyForDev)
    const commandOwned = commands.find(cmd => cmd.name === cmdToSearch.toLowerCase()) ?? commands.find(cmd => cmd.aliases?.includes(cmdToSearch.toLowerCase()));

    if (!commandOwned) return ctx.editOrReply({ embeds: [embed.setColor("Red").setDescription(`Command with name \`${cmdToSearch}\` is not found.`)] });

    const appCommands = await ctx.client.proxy.applications(ctx.client.applicationId)?.commands?.get();

    embed.setColor(colors.Primary)
        .setAuthor({ name: commandOwned.props?.category })
        .setTitle(convertToSlash(appCommands, commandOwned))
        .setDescription(`*${translate[commandOwned.name].description}${commandOwned.aliases?.length > 0 ? `\nAliases: ${commandOwned.aliases.map(n => convertToSlash(appCommands, n)).join(", ")}`: ""}${Object.entries(commandOwned?.options).length > 0 ? `\nUsage examples: ${convertToSlash(appCommands, commandOwned)}` : ""}*`)
        .setFooter({ text: `Cooldown: ${msToSecond(commandOwned.cooldown?.interval ?? 1000)} second` });

    ctx.editOrReply({ embeds: [embed] });
}

/**
 * Replies with the localized overview of all available commands.
 *
 * @param ctx The command context used to resolve the current locale.
 */
async function commandsList(ctx: CommandContext) {
    const translate = ctx.t.get();

    const commands = ctx.client.commands.values.filter(cmd => !cmd.props.onlyForDev);
    const embed = new Embed().setColor(colors.Primary).setTitle(translate.help.list.title).setDescription(translate.help.list.description);

    const appCommands = await ctx.client.proxy.applications(ctx.client.applicationId)?.commands?.get();

    const categories = readdirSync("app/commands").filter(name => name !== "Developer");
    for (const category of categories) {
        embed.addFields({ name: category, value: commands.filter(cmd => cmd.props?.category === category).map(cmd => convertToSlash(appCommands, cmd)).join(", "), inline: true });
    }

    ctx.editOrReply({ embeds: [embed] });
}

function convertToSlash(appCommands: unknown, commandOwned: unknown) {
    const command = appCommands?.find(cmd => cmd.name === (commandOwned?.name ?? commandOwned)?.toLowerCase());
    const name = (Object.entries(commandOwned?.options).length > 0 ? `${commandOwned.name} ${commandOwned.options.map(o => o.name).join(" ")}` : command.name;
    return command?.id ? `</${name?.toLowerCase()}:${command.id}>` : `\`/${name?.toLowerCase()}\``;
}

function msToSecond(ms: number) {
    return Math.floor(ms / 1000 % 60);
}