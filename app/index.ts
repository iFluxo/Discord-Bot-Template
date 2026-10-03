/*
 * Surface otherwise-silent asynchronous failures so they can be diagnosed
 * instead of crashing or being swallowed by the runtime.
 */
process.on("unhandledRejection", (info) => console.error("UnhandledRejection?!", info as unknown));
process.on("uncaughtException", (info) => console.error("UncaughtException?!", info as unknown));

import { type CooldownMiddlewares, cooldown } from "@slipher/cooldown";
import { DatabasePlugin } from "lib/database.plugin";
import { WebhookPlugin } from "lib/webhook.plugin";
import type { LocaleString, Client as SeyfertClient } from "seyfert";
import { definePlugins, Logger, type ParseClient, type ParseGlobalMiddlewares } from "seyfert";
import { formatMemoryUsage } from "seyfert/lib/common/it/logger";
import { Yuna } from "yunaforseyfert";
import type * as config from "#config";
import type enUS from "./languages/en-US";
import * as globalMiddlewares from "./middlewares/index";
import { Client } from "./structures/Client";

/**
 * Plugin stack registered on the client. Parser options mirror the prefix
 * conventions used by the message-command parser, and the cooldown plugin
 * applies rate limiting globally.
 */
const plugins = definePlugins(
    Yuna.plugin({
        parser: { syntax: { namedOptions: ["-", "--"] } },
    }),
    DatabasePlugin(),
    WebhookPlugin({
        log: Bun.env.WebhookLogUrl,
    }),
    cooldown({
        middleware: { global: true },
    }),
);

/*
 * Expose application-wide metadata to Seyfert's type system so that
 * middleware results, plugin exports, and language resources are strongly typed.
 */
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
        category?: string;
    }

    interface InternalOptions {
        withPrefix: true | false;
    }
}

/*
 * Extend every command context with the shared application config object.
 */
declare module "seyfert/lib/commands/applications/shared" {
    interface ExtendContext {
        config: typeof config;
    }
}

/*
 * Reach into Seyfert's internal logger cache so the memory figure in log
 * output can be reused across log lines instead of being sampled per line.
 */
const loggerMemory = Logger as unknown as { __memoryCache: { rss: number; ts: number } };

Logger.customize((_logger, level, args) => {
    const now = Date.now();

    /*
     * Refresh the sampled RSS memory usage at most once per second to avoid
     * the cost of a syscall for every individual log entry.
     */
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

/*
 * Instantiate the bot client with all middlewares registered globally and
 * then bind the middleware services and language resources to the registry.
 */
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
