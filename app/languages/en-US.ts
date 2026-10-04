export default {
    metadata: {
        name: "English",
        code: "en-US",
    },

    help: {
        description: "Displaying commands list and usage helper.",
        list: {
            title: "Commands list",
            description: (helpSlash?: string) => `This is a list of commands. Use ${helpSlash} for more spesific command info.`,
        },
        specific: {
            searching: (cmdName?: string) => `*Searching command with name \`${cmdName}\`...*`,
            notFound: (cmdName?: string) => `Command with name \`${cmdName}\` is not found.`,
            aliases: (list?: string) => `aliases: ${list}`,
            category: (name?: string) => `category: \`${name}\``,
            cooldown: (cd?: number) => `cooldown: \`${cd} seconds\``,
        },
        options: {
            command: "Input a command name.",
        },
    },
    avatar: {
        description: "Showing the user global and guild avatar.",
    },
    prefix: {
        description: "Set an extra command prefix or reset to defaults for this server.",
    },
    language: {
        description: "Change the bot language for this server.",
    },
    ping: {
        title: "Latency",
        description: "Showing client, runtime and database latency.",
        client: {
            title: "Client",
            value: (ping?: number) => `\`${ping ?? 0} ms\``,
        },
        database: {
            title: "Database",
            value: (ping?: number) => `\`${ping ?? 0} ms\``,
        },
        runtime: {
            title: "Runtime",
            value: (ping?: number) => `\`${ping ?? 0} ms\``,
        },
    },
};
