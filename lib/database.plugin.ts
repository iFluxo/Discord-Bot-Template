import { AIODatabase } from "app/database/index";
import type { Client } from "app/structures/Client";
import { createPlugin } from "seyfert";

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
