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
        spesific: {
            searching: (cmdName?: string) => `*Searching command with name \`${cmdName}\`...*`,
            notFound: (cmdName?: string) => `Command with name \`${cmdName}\` is not found.`,
            aliases: (list?: string) => `Aliases?: ${list}`,
            cooldown: (cd?: number) => `Cooldown?: ${cd} seconds`,
        },
        options: {
            command: "Input a command name.",
        }
    },
    ping: {
        description: "Showing client, database, and runtime latency.",
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
