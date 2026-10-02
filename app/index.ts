process.on("unhandledRejection", info => console.error("UnhandledRejection?!", info as unknown));
process.on("uncaughtException", info => console.error("UncaughtException?!", info as unknown));

import { Logger, type ParseClient, definePlugins } from "seyfert";
import { Yuna } from "yunaforseyfert";
import { CooldownMiddlewares, cooldown } from "@slipher/cooldown";
import { formatMemoryUsage } from "seyfert/lib/common/it/logger";
import * as globalMiddlewares from "./middlewares/index";
import { webhookClientPlugin } from "./plugins/webhookClient"

const plugins = definePlugins(
    Yuna.plugin({
        parser: { syntax: { namedOptions: ['-', '--'] },},
    }),
    cooldown({
        middleware: { global: true }
    }),
    webhookClientPlugin(),
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
    interface UsingClient extends ParseClient<Client<true>> {}
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
    if (now - logger.__memoryCache.ts > 1000) {
        logger.__memoryCache = { rss: process.memoryUsage?.()?.rss ?? 0, ts: now };
    }
    const color = logger.colorFunctions.get(level) ?? logger.noColor;
    return [formatMemoryUsage(logger.__memoryCache.rss).replace("RAM Usage ", ""), `${color(logger.prefixes.get(level) ?? "DEBUG")} >`, ...args];
});

import { Client } from "./structures/Client";
const client = new Client({ globalMiddlewares: Object.keys(globalMiddlewares), plugins })

client.setServices({ middlewares: globalMiddlewares });