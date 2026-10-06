import { AIODatabase } from "app/database/index";
import type { Client } from "app/structures/Client";
import { createPlugin } from "seyfert";

export function DatabasePlugin(connectedLog: boolean = false) {
    return createPlugin({
        name: "Database",
        ctx: {
            db: (_interaction, client) => new AIODatabase(client as Client, connectedLog),
        },
        client: {
            db: (client) => new AIODatabase(client as Client, connectedLog),
        },
        setup(client) {
            client.logger.info(`[${this.name}-Plugin] loaded`);
        },
    });
}
