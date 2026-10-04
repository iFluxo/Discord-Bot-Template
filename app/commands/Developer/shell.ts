import { execSync } from "node:child_process";
import { Command, type CommandContext, createStringOption, Declare, Embed, Formatter, MessageFlags, Options } from "seyfert";
import { DeclareParserConfig, ParserRecommendedConfig, Watch, Yuna } from "yunaforseyfert";
import { config } from "#config";

const { inspect } = Bun;

const shellOptions = {
    cmd: createStringOption({
        description: "Some command.",
    }),
};

@Declare({
    name: "shell",
    aliases: ["sh"],
    description: "No explanation.",
    defaultMemberPermissions: ["ManageGuild", "Administrator"],
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    guildId: config.DevGuilds,
    props: {
        onlyForDev: true,
    },
})

@Options(shellOptions)
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
                        .setDescription(`> Shell watcher ended <t:${Math.trunc(Date.now() / 1000)}:R>. (\`${reason}\`)`)
                        .setColor("Greyple"),
                ],
            });
        },
    })
    async run(ctx: CommandContext<typeof shellOptions>) {
        const { client, options, channelId } = ctx;

        const start = Date.now();

        const cmd = options?.cmd;
        let output = null;

        await client.channels.typing(channelId);

        if (!cmd?.length)
            return await ctx.editOrReply({
                embeds: [new Embed().setDescription("`❌` Input command!").setColor("Red")],
                flags: MessageFlags.Ephemeral,
            });

        try {
            output = execSync(cmd).toString();
            await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setColor("Green")
                        .setTitle(`> \`${cmd}\``)
                        .setDescription(`${Formatter.codeBlock(output ?? "", "bash")}`)
                        .setFooter({
                            text: `Unix Shell | ${Math.floor(Date.now() - start)} ms`,
                        }),
                ],
            });
        } catch (error: unknown) {
            await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setColor("Red")
                        .setTitle(`> \`${cmd}\``)
                        .setDescription(Formatter.codeBlock(inspect(error).slice(0, 4080), "bash"))
                        .setFooter({
                            text: `Error | ${Math.floor(Date.now() - start)} ms`,
                        }),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }
    }
}
