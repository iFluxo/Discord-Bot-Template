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

/**
 * Slash-command options for the eval developer command.
 */
const evalOptions = {
    code: createStringOption({
        description: "Some code.",
    }),
    depth: createIntegerOption({
        description: "Depth of the result.",
        min_value: 0,
    }),
};

/**
 * Developer-only command that evaluates arbitrary JavaScript in the bot process.
 * Intended for trusted developers for debugging purposes only.
 */
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

@Options(evalOptions)
@DeclareParserConfig(ParserRecommendedConfig.Eval)
export default class EvalCommand extends Command {
    @Watch({
        /*
         * Only one active watcher is allowed per user and command; starting a
         * new execution stops the previous watcher with a user-visible notice.
         */
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
    async run(ctx: CommandContext<typeof evalOptions>) {
        const { client, options, channelId } = ctx;

        const start = Date.now();
        const depth = options?.depth ?? 0;

        let code = options?.code;
        let output = null;
        let typecode: string | undefined;

        await client.channels.typing(channelId);

        if (!code?.length)
            return await ctx.editOrReply({
                embeds: [new Embed().setDescription("`❌` Input code!").setColor("Red")],
                flags: MessageFlags.Ephemeral,
            });

        /*
         * Wrap top-level await expressions in an async IIFE so that snippets
         * such as "await foo()" can be evaluated without a surrounding block.
         */
        try {
            if (typeof output !== "string") {
                if (/^(?:\(?)\s*await\b/.test(code.toLowerCase())) code = `(async () => ${code})()`;

                output = await eval(code ?? "");
                typecode = typeof output;
                output = inspect(output, { depth }).replace(Bun.env.Token ?? "No Token Found!?", "X".repeat(Bun.env.Token?.length ?? 1));
            }

            /*
             * Discord caps embed descriptions at 4096 characters; truncate long
             * outputs to stay within the limit while keeping a code block intact.
             */
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
