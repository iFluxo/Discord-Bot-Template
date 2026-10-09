import { readdirSync } from "node:fs";
import { join } from "node:path";
import { Cooldown } from "@slipher/cooldown";
import {
    Command,
    type CommandContext,
    Container,
    createStringOption,
    Declare,
    type DefaultLocale,
    MessageFlags,
    Options,
    type RESTGetAPIApplicationCommandsResult,
    Separator,
    TextDisplay,
} from "seyfert";

import { emojis as categoryEmoji } from "#config";

const helpOptions = {
    command: createStringOption({
        description: "Input a command name.",
    }),
};

@Declare({
    name: "help",
    aliases: ["h"],
    description: "Displaying commands list and usage helper.",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
    botPermissions: ["EmbedLinks"],
})
@Cooldown.user(3_000)
@Options(helpOptions)
export default class HelpCommand extends Command {
    async run(ctx: CommandContext<typeof helpOptions>) {
        if (ctx.options?.command?.length) await helpSpesific(ctx);
        else await commandsList(ctx);
    }
}

async function helpSpesific(ctx: CommandContext<typeof helpOptions>) {
    const translate = ctx.t.get();

    const cmdToSearch = ctx.options.command;
    if (!cmdToSearch) return;

    await ctx.editOrReply({
        components: [new Container().addComponents(new TextDisplay().setContent(translate.help.specific.searching(cmdToSearch)))],
        flags: MessageFlags.IsComponentsV2,
    });

    const commands = ctx.client.commands.values.filter((cmd) => !cmd.props.onlyForDev);
    const commandOwned =
        commands.find((cmd) => cmd.name === cmdToSearch.toLowerCase()) ??
        commands.find((cmd) => cmd instanceof Command && cmd.aliases?.includes(cmdToSearch.toLowerCase()));

    if (!commandOwned)
        return await ctx.editOrReply({
            components: [new Container().addComponents(new TextDisplay().setContent(translate.help.specific.notFound(cmdToSearch)))],
            flags: MessageFlags.IsComponentsV2,
        });

    const appCommands = await getAppCommands(ctx);
    const commandNameSlash = convertToSlash(appCommands, commandOwned.name);

    const commandAliases = commandOwned instanceof Command ? (commandOwned.aliases ?? []) : [];
    const aliasesText = commandAliases.length
        ? ` ( ${commandAliases.map((name) => convertToSlash(appCommands, commandOwned.name).replace(commandOwned.name, name)).join(", ")} )`
        : "";

    const container = new Container().addComponents(
        new TextDisplay().setContent(`## ${commandNameSlash}${aliasesText}\n${commandDescription(translate, commandOwned.name)}`),
        new Separator(),
        new TextDisplay().setContent(
            `- ${translate.help.specific.category(commandOwned.__filePath?.split("/").at(-2))}\n- ${translate.help.specific.cooldown(msToSecond(commandOwned.cooldown?.interval ?? 1000))}`,
        ),
    );

    await ctx.editOrReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
}

async function commandsList(ctx: CommandContext) {
    const translate = ctx.t.get();

    const commands = ctx.client.commands.values.filter((cmd) => !cmd.props.onlyForDev);
    const appCommands = await getAppCommands(ctx);

    const commandComponents = [];
    const commandsRoot = join(import.meta.dir, "..");
    const categories = readdirSync(commandsRoot).filter((name) => name !== "Developer");
    for (const category of categories) {
        commandComponents.push(
            new Separator(),
            new TextDisplay().setContent(
                `### \`${categoryEmoji[`#${category}` as keyof typeof categoryEmoji]}\` ${category}\n- - ${commands
                    .filter((cmd) => cmd.__filePath?.split("/").at(-2) === category)
                    .map((cmd) => convertToSlash(appCommands, cmd.name))
                    .join(", ")}`,
            ),
        );
    }

    const container = new Container().addComponents(
        new TextDisplay().setContent(
            `## ${translate.help.list.title}\n${translate.help.list.description(convertToSlash(appCommands, ctx.command.name))}`,
        ),
        ...commandComponents,
    );

    await ctx.editOrReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
}

const APP_COMMANDS_TTL = 300_000;

let appCommandsCache: { data: RESTGetAPIApplicationCommandsResult | undefined; expires: number } | undefined;

async function getAppCommands(ctx: CommandContext): Promise<RESTGetAPIApplicationCommandsResult | undefined> {
    const now = Date.now();

    if (appCommandsCache && appCommandsCache.expires > now) {
        return appCommandsCache.data;
    }

    const data = await ctx.client.proxy.applications(ctx.client.applicationId)?.commands?.get();
    appCommandsCache = { data, expires: now + APP_COMMANDS_TTL };

    return data;
}

function convertToSlash(appCommands: RESTGetAPIApplicationCommandsResult | undefined, name: string) {
    const command = appCommands?.find((cmd) => cmd.name === name?.toLowerCase());
    return command ? `</${name?.toLowerCase()}:${command.id}>` : `\`/${name?.toLowerCase()}\``;
}

function commandDescription(translate: DefaultLocale, name: string) {
    const entry = translate[name as keyof DefaultLocale];
    return entry && "description" in entry ? entry.description : "";
}

function msToSecond(ms: number) {
    return Math.floor((ms / 1000) % 60);
}
