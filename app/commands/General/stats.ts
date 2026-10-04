import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Declare,
    Container, Separator, TextDisplay, MesageFlags,
} from "seyfert";

import os from "node:os";

@Declare({
    name: "stats",
    aliases: ["st"],
    description: "Showing about bot statistics",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
    botPermissions: ["EmbedLinks"],
})
@Cooldown.user(1_000)
export default class Template extends Command {
    async run(ctx: CommandContext) {
        const container = new Container()
            .addComponents(
                new TextDisplay()
                    .setContent(`## Statistics Information\n${ctx.command.description}`),
                new Separator(),
                new TextDisplay()
                    .setContent(`
                        ### OS\n
                        - \`${os.type()}\`\n
                        ### Release\n
                        - \`${os.release()}\`\n
                        ### Arch
                        - \`${os.machine()}\`\n
                        ### CPU ( Cores )
                        - \`${os.cpus()[0].model}\` ( \`${os.cpus().length}\` )
                        ### Uptime: <t:${Math.round((Date.now() - (Bun.nanoseconds() ?? 0)) / 1000)}:R>
                    `)
            )

        await ctx.editOrReply({ components: [container], flags: MessageFlags.IsComponentsV2, })
    }
}
