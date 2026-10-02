import { createPlugin } from "seyfert";

export type PluginOptions = Record<string, string>;

export interface WebhookData {
    id: string;
    token: string;
    url: string;
}

export interface Webhook {
    data: WebhookData;

    send(
        message: Record<string, unknown>,
    ): Promise<unknown>;

    edit(
        messageId: string,
        message: Record<string, unknown>,
    ): Promise<unknown>;

    fetch(
        messageId: string,
    ): Promise<unknown>;

    delete(
        messageId: string,
    ): Promise<void>;
}

export interface WebhookCollection {
    name: string;
    version: string;
    creator: string;

    [name: string]:
        | string
        | Webhook;
}

export function WebhookPlugin(
    options: PluginOptions = {},
) {
    const hooks: WebhookCollection = {
        name: "Webhook Client",
        version: "0.0.1-flux",
        creator: "iFluxo (Fluxo)",
    };

    return createPlugin({
        name: "WebhookClient",

        client: {
            webhook: () => hooks,
        },

        ctx: {
            webhook: () => hooks,
        },

        async setup(client) {
            let size = 0;

            for (const [hookName, webhookUrl] of Object.entries(options)) {
                const data = getData(webhookUrl);

                if (!data) {
                    client.logger.warn(
                        `[${this.name}-Plugin] WEBHOOK URL for "${hookName}" is not valid!`,
                    );

                    continue;
                }

                hooks[hookName] = createWebhook(data);

                size++;
            }

            client.logger.info(
                `[${this.name}-Plugin] ${size} Loaded.`,
            );

            return this;
        },
    });
}

/**
 * Create a webhook API instance.
 */
function createWebhook(
    data: WebhookData,
): Webhook {
    const { id, token } = data;

    return {
        data,

        /**
         * Send message
         *
         * POST /webhooks/{id}/{token}?wait=true
         */
        async send(message) {
            return request(
                `/webhooks/${id}/${token}?wait=true`,
                {
                    method: "POST",
                    body: message,
                },
            );
        },

        /**
         * Edit message
         *
         * PATCH /webhooks/{id}/{token}/messages/{message.id}
         */
        async edit(messageId, message) {
            return request(
                `/webhooks/${id}/${token}/messages/${messageId}`,
                {
                    method: "PATCH",
                    body: message,
                },
            );
        },

        /**
         * Fetch message
         *
         * GET /webhooks/{id}/{token}/messages/{message.id}
         */
        async fetch(messageId) {
            return request(
                `/webhooks/${id}/${token}/messages/${messageId}`,
                {
                    method: "GET",
                },
            );
        },

        /**
         * Delete message
         *
         * DELETE /webhooks/{id}/{token}/messages/{message.id}
         */
        async delete(messageId) {
            await request(
                `/webhooks/${id}/${token}/messages/${messageId}`,
                {
                    method: "DELETE",
                },
            );
        },
    };
}

/**
 * Manual Discord REST API request.
 */
async function request(
    path: string,
    options: {
        method: "GET" | "POST" | "PATCH" | "DELETE";
        body?: Record<string, unknown>;
    },
): Promise<unknown> {
    const response = await fetch(
        `https://discord.com/api/v10${path}`,
        {
            method: options.method,

            headers: {
                Accept: "application/json",

                ...(options.body
                    ? {
                          "Content-Type":
                              "application/json",
                      }
                    : {}),
            },

            ...(options.body
                ? {
                      body: JSON.stringify(
                          options.body,
                      ),
                  }
                : {}),
        },
    );

    /**
     * DELETE normally returns 204 No Content.
     */
    if (response.status === 204) {
        return undefined;
    }

    /**
     * Discord returns JSON for successful
     * webhook operations and API errors.
     */
    const contentType =
        response.headers.get(
            "content-type",
        ) ?? "";

    let result: unknown;

    if (contentType.includes("application/json")) {
        result = await response.json();
    } else {
        result = await response.text();
    }

    /**
     * Convert Discord API errors into useful
     * JavaScript errors.
     */
    if (!response.ok) {
        const error = new Error(
            `Discord API Error ${response.status}: ${response.statusText}`,
        ) as Error & {
            status: number;
            body: unknown;
        };

        error.status = response.status;
        error.body = result;

        throw error;
    }

    return result;
}

/**
 * Parse Discord webhook URL.
 *
 * Supported:
 *
 * https://discord.com/api/webhooks/{id}/{token}
 * https://discord.com/api/v10/webhooks/{id}/{token}
 * https://ptb.discord.com/api/v10/webhooks/{id}/{token}
 * https://canary.discord.com/api/v10/webhooks/{id}/{token}
 */
function getData(
    webhookUrl: string,
): WebhookData | null {
    if (
        typeof webhookUrl !== "string" ||
        webhookUrl.length === 0
    ) {
        return null;
    }

    const match = webhookUrl
        .trim()
        .match(
            /^https?:\/\/(?:ptb\.|canary\.)?discord\.com\/api(?:\/v\d{1,2})?\/webhooks\/(\d{17,20})\/([^/?#\s]+)\/?$/i,
        );

    if (!match) {
        return null;
    }

    const [, id, token] = match;

    if (!id || !token) {
        return null;
    }

    return {
        id,
        token,
        url: webhookUrl,
    };
}