import {
    Command,
    type CommandContext,
    createIntegerOption,
    createStringOption,
    Declare,
    Embed,
    Formatter,
    MessageFlags,
    Options,
} from "seyfert";
import { DeclareParserConfig, ParserRecommendedConfig, Watch, Yuna } from "yunaforseyfert";

import { config } from "#config";

const { inspect } = Bun;

@Declare({
    name: "eval",
    aliases: [],
    description: "No explanation.",
    defaultMemberPermissions: ["ManageGuild", "Administrator"],
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    guildId: config.DevGuilds,
    props: {
        category: "Developer",
    },
})
@Options({
    code: createStringOption({
        description: "Some code.",
    }),
    depth: createIntegerOption({
        description: "Depth of the result.",
        min_value: 0,
    }),
})
@DeclareParserConfig(ParserRecommendedConfig.Eval)
export default class EvalCommand extends Command {
    @Watch({
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
        const depth = options?.depth ?? 0;

        let code = options?.code;
        let output = null;
        let typecode: string;

        await client.channels.typing(channelId);

        if (!code && !code?.length)
            return ctx.editOrReply({
                embeds: [new Embed().setDescription("`❌` Input code!").setColor("Red")],
                flags: MessageFlags.Ephemeral,
            });

        try {
            if (typeof output !== "string") {
                if (/^(?:\(?)\s*await\b/.test(code.toLowerCase())) code = `(async () => ${code})()`;

                output = await eval(code ?? "");
                typecode = typeof output;
                output = inspect(output, { depth }).replace(Bun.env.Token ?? "No Token Found!?", "X".repeat(Bun.env.Token?.length ?? 1));
            }

            await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setColor("Green")
                        .setDescription(
                            `${output?.length > 4083 ? Formatter.codeBlock(`${(output ?? "").slice(0, 4080)}...`, "js").trim() : Formatter.codeBlock(output ?? "", "js")}`,
                        )
                        .setTimestamp()
                        .setFooter({
                            text: `Type: ${typecode} | ${Math.floor(Date.now() - start)}ms`,
                        }),
                ],
            });
        } catch (error) {
            await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setColor("Red")
                        .setDescription(Formatter.codeBlock(inspect(error).slice(0, 4080), "js"))
                        .setTimestamp()
                        .setFooter({
                            text: `Type: Error | ${Math.floor(Date.now() - start)}ms`,
                        }),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }
    }
}
