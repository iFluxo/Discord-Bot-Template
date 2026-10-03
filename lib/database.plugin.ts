import { AIODatabase } from "app/database/index";
import type { Client } from "app/structures/Client";
import { createPlugin } from "seyfert";

/**
 * Registers the database manager on both the client and command contexts so
 * it can be accessed as `client.db` or `ctx.db`.
 *
 * @returns The configured Seyfert plugin definition.
 */
export function DatabasePlugin() {
    return createPlugin({
        name: "Database",
        ctx: {
            db: (_interaction, client) => new AIODatabase(client as Client),
        },
        client: {
            db: (client) => new AIODatabase(client as Client),
        },
        setup(client) {
            client.logger.info(`[${this.name}-Plugin] Loaded.`);
        },
    });
}
