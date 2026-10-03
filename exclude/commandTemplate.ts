import {
    Declare,
    Command,
    type CommandContext,
} from "seyfert";
import { Cooldown } from "@slipher/cooldown";

@Declare({
    name: "",
    aliases: [],
    description: "",
    contexts: ["Guild"],
    integrationTypes: ["GuildInstall"],
    botPermissions: ["EmbedLinks"],
})
@Cooldown.user(3_000)

export default class Template extends Command {
    async run(ctx: CommandContext) {
        ctx.write({ content: "Hi, from template" })
    }
}