process.on("unhandledRejection", (info) => console.error("UnhandledRejection?!", info as unknown));
process.on("uncaughtException", (info) => console.error("UncaughtException?!", info as unknown));

import { type CooldownMiddlewares, cooldown } from "@slipher/cooldown";
import { DatabasePlugin } from "app/plugins/database.plugin";
import { WebhookPlugin } from "app/plugins/webhook.plugin";
import type { LocaleString, Client as SeyfertClient } from "seyfert";
import { definePlugins, Logger, type ParseClient, type ParseGlobalMiddlewares } from "seyfert";
import { formatMemoryUsage } from "seyfert/lib/common/it/logger";
import { Yuna } from "yunaforseyfert";
import type * as config from "#config";
import type enUS from "./languages/en-US";
import * as globalMiddlewares from "./middlewares/index";
import { Client } from "./structures/Client";

const plugins = definePlugins(
    Yuna.plugin({
        parser: { syntax: { namedOptions: ["-", "--"] } },
    }),
    DatabasePlugin(),
    WebhookPlugin({
        log: import.meta.env.WebhookLogUrl ?? "",
    }),
    cooldown({
        middleware: { global: true },
    }),
);

declare module "seyfert" {
    interface SeyfertRegistry {
        client: ParseClient<SeyfertClient<true>>;
        plugins: typeof plugins;
        middlewares: CooldownMiddlewares<"cooldown"> & typeof globalMiddlewares;
        langs: typeof enUS;
    }

    interface GlobalMetadata extends ParseGlobalMiddlewares<typeof globalMiddlewares> {}

    interface ExtraProps {
        onlyForAdmins?: boolean;
        onlyForDev?: boolean;
        disabled?: boolean;
    }

    interface InternalOptions {
        withPrefix: true | false;
    }
}

declare module "seyfert/lib/commands/applications/shared" {
    interface ExtendContext {
        config: typeof config;
        readyAt: number;
    }
}

const loggerMemory = Logger as unknown as { __memoryCache: { rss: number; ts: number } };

Logger.customize((_logger, level, args) => {
    const now = Date.now();

    if (now - loggerMemory.__memoryCache.ts > 1000) {
        loggerMemory.__memoryCache = { rss: process.memoryUsage?.()?.rss ?? 0, ts: now };
    }
    const color = Logger.colorFunctions.get(level) ?? Logger.noColor;
    return [
        formatMemoryUsage(loggerMemory.__memoryCache.rss).replace("RAM Usage ", ""),
        `${color(Logger.prefixes.get(level) ?? "DEBUG")} >`,
        ...args,
    ];
});

const client = new Client({
    globalMiddlewares: Object.keys(globalMiddlewares),
    plugins,
});

client.setServices({
    middlewares: globalMiddlewares,
    langs: {
        default: "en-US",
        aliases: {
            "en-US": ["en" as unknown as LocaleString],
        },
    },
});
