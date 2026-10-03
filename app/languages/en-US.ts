export default {
    metadata: {
        name: "English",
        code: "en-US",
    },

    help: {
        category: "General",
        description: "Displaying commands list and usage helper.",
        list: {
            title: "Commands list",
            description: "This is a list of commands. Use `/help :command name` for spesific command info.",
        },
        spesific: {
            title: "Help command",
            description: "Specific command information. Usage is `/help` or `/help :command name`.",
        },
        options: {
            command: "Input a command name.",
        },
    },
    ping: {
        category: "General",
        description: "Showing client and runtime latency.",
        client: {
            title: "Client latency",
            value: (ping?: number) => `\`${ping ?? 0} ms\``,
        },
        database: {
            title: "Database latency",
            value: (ping?: number) => `\`${ping ?? 0} ms\``,
        },
        runtime: {
            title: "Runtime latency",
            value: (ping?: number) => `\`${ping ?? 0} ms\``,
        },
    },
};
