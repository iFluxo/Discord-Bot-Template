import { config } from "seyfert";

export default config.bot({
    token: process.env.Token ?? "Invalid Bot Token!",
    locations: {
        base: "app",
        commands: "commands",
        components: "components",
        events: "events",
    },
    intents: ["Guilds", "GuildMessages", "MessageContent"]
});