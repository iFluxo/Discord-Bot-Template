import { AIODatabase } from "app/database/index";
import { createPlugin } from "seyfert";

export function DatabasePlugin() {
    return createPlugin({
        name: "Database",
        ctx: {
            db: () => new AIODatabase(),
        },
        client: {
            db: () => new AIODatabase(),
        },
        setup(client) {
            client.logger.info(`[${this.name}-Plugin] Loaded.`);
        },
    });
}
