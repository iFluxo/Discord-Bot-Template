import {
    Command,
    MessageFlags,
    type CommandContext,
    createIntegerOption,
    createStringOption,
    Declare,
    Embed,
    Formatter,
    Options
} from "seyfert";
import {
    DeclareParserConfig,
    ParserRecommendedConfig,
    Watch,
    Yuna,
} from "yunaforseyfert";
import { inspect } from "node:util";

const option = {
    code: createStringOption({
        description: "Some code.",
    }),
    depth: createIntegerOption({
        description: "Depth of the result.",
        min_value: 0,
    }),
};

@Declare({
    name: "eval",
    description: "No explanation.",
    aliases: [],
    defaultMemberPermissions: ["ManageGuild", "Administrator"],
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    props: {
        category: "Developer"
    },
})
@Options(option)
@DeclareParserConfig(ParserRecommendedConfig.Eval)

export default class EvalCommand extends Command {
    @Watch({
        idle: 60_000,
        beforeCreate(ctx) {
            const watcher = Yuna.watchers.find(ctx.client, {
                userId: ctx.author.id,
                command: this,
            });
            if (!watcher) return;

            watcher.stop("Another Execution");
        },
        onStop(reason) {
            this.ctx?.editOrReply({
                content: "",
                embeds: [
                    new Embed()
                        .setDescription(`\`📕\` Eval command watcher ended <t:${Math.trunc(Date.now() / 1000)}:R>. (\`${reason}\`)`)
                        .setColor("Greyple"),
                ],
            });
        },
    })
    async run(ctx: CommandContext) {
        const { client, options, channelId } = ctx;

        const start = Date.now();
        const depth = (options as { depth?: number }).depth ?? 0;

        let code = (options as { code?: string | null })?.code ?? null;
        let output = null;
        let typecode;

        await client.channels.typing(channelId);

        if (!code && !code?.length)
            return ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setDescription("`❌` Input code!")
                        .setColor("Red"),
                ],
                flags: MessageFlags.Ephemeral
            });

        try {
            if (typeof output !== "string") {
                if (/^(?:\(?)\s*await\b/.test(code.toLowerCase()))
                code = `(async () => ${code})()`;

                output = await eval(code ?? "");
                typecode = typeof output;
                output = inspect(output, { depth }).replace(process.env.Token ?? "No Token Found!?", "X".repeat(process.env.Token?.length ?? 1))
            }

            await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setColor("Green")
                        .setDescription(`${output?.length > 4083 ? Formatter.codeBlock((output ?? "").slice(0, 4080) + "...", "js").trim() : Formatter.codeBlock(output ?? "", "js")}`)
                        .setTimestamp()
                        .setFooter({ text: `Type: ${typecode} | ${Math.floor(Date.now() - start)}ms` })
                ],
            });
        } catch (error) {
            await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setColor("Red")
                        .setDescription(Formatter.codeBlock(inspect(error).slice(0, 4080), "js"))
                        .setTimestamp()
                        .setFooter({ text: `Type: Error | ${Math.floor(Date.now() - start)}ms` })
                ],
                flags: MessageFlags.Ephemeral
            });
        }
    }
}