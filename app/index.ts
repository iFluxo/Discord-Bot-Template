process.on("unhandledRejection", info => console.error("UnhandledRejection?!", info as unknown));
process.on("uncaughtException", info => console.error("UncaughtException?!", info as unknown));

import { Client } from "./structures/Client";
import { Logger, ParseClient, ParseGlobalMiddlewares, definePlugins } from "seyfert";
import { Yuna } from "yunaforseyfert";
import { CooldownMiddlewares, cooldown } from "@slipher/cooldown";
import { formatMemoryUsage } from "seyfert/lib/common/it/logger";
import * as globalMiddlewares from "./middlewares/index";

import { WebhookPlugin } from "lib/webhook.plugin";

const plugins = definePlugins(
    Yuna.plugin({
        parser: { syntax: { namedOptions: ['-', '--'] },},
    }),
    WebhookPlugin({
        log: "https://discord.com/api/webhooks/1231915746666352670/etkARVaRE_D81COoihRcJQYjtlxjiG3vPtxfPkplcAvg6jJ_x_9v9Qq9CsbszSKTpte4",
    }),
    cooldown({
        middleware: { global: true }
    }),
);

declare module "seyfert" {
    interface SeyfertRegistry { plugins: typeof plugins }
}

declare module "seyfert" {
    interface SeyfertRegistry { middlewares: CooldownMiddlewares<"cooldown"> & typeof globalMiddlewares }
    interface GlobalMetadata
    extends ParseGlobalMiddlewares<typeof globalMiddlewares> {}
}

declare module "seyfert" {
    interface ExtraProps {
        botAdminOnly?: boolean;
        botDeveloperOnly?: boolean;
        disabled?: boolean;
        category?: string;
    }
}

declare module "seyfert" {
    interface InternalOptions {
        withPrefix: true | false;
    }
}

Logger.customize((logger, level, args) => {
    const now = Date.now();
    if (now - Logger.__memoryCache.ts > 1000) {
        Logger.__memoryCache = { rss: process.memoryUsage?.()?.rss ?? 0, ts: now };
    }
    const color = Logger.colorFunctions.get(level) ?? Logger.noColor;
    return [formatMemoryUsage(Logger.__memoryCache.rss).replace("RAM Usage ", ""), `${color(Logger.prefixes.get(level) ?? "DEBUG")} >`, ...args];
});



const client = new Client({ globalMiddlewares: Object.keys(globalMiddlewares), plugins })

client.setServices({ middlewares: globalMiddlewares });