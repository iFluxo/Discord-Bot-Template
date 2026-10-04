import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Declare,
    Container, Separator, TextDisplay, MessageFlags,
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
                        ### OS
                        \n- \`${os.type()}\`
                        \n### Release
                        \n- \`${os.release()}\`
                        \n### Arch
                        \n- \`${os.platform()}\` \`${os.machine()}\`
                        \n### CPU ( Cores )
                        \n- \`AMD Ryzen 9 9950X\` ( \`16\` )
                        \n### Uptime
                        \n- <t:${ctx.readyAt}:R>
                    `)
            )

        await ctx.editOrReply({ components: [container], flags: MessageFlags.IsComponentsV2, })
    }
}
