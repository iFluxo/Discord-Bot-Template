import "./plugins/utils.logger";

import { type CooldownMiddlewares, cooldown } from "@slipher/cooldown";
import { DatabasePlugin } from "./plugins/database.plugin";
import { WebhookPlugin } from "./plugins/webhook.plugin";
import type { LocaleString, Client as SeyfertClient } from "seyfert";
import { definePlugins, type ParseClient, type ParseGlobalMiddlewares } from "seyfert";
import { Yuna } from "yunaforseyfert";
import type * as config from "#config";
import type enUS from "./languages/en-US";
import * as globalMiddlewares from "./middlewares/index";
import { Client } from "./structures/Client";

const plugins = definePlugins(
    Yuna.plugin({
        parser: { syntax: { namedOptions: ["-", "--"] } },
    }),
    DatabasePlugin({
        connectedLog: true,
    }),
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
