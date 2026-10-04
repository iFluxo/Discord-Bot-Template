/**
 * English (en-US) language resource bundle. Accessed through the
 * localized context helpers such as `ctx.t.get()`.
 */
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
        }
    },
    ping: {
        title: "Latency",
        description: "Showing client, database, and runtime latency.",
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
