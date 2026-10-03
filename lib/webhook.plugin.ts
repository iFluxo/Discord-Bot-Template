import { createPlugin } from "seyfert";

export type PluginOptions = Record<string, string>;

export interface WebhookData {
    id: string;
    token: string;
}

export type WebhookMessage = string | Record<string, unknown>;

export interface Webhook {
    data: WebhookData;

    send(message: WebhookMessage): Promise<unknown>;

    edit(messageId: string, message: WebhookMessage): Promise<unknown>;

    fetch(messageId: string): Promise<unknown>;

    delete(messageId: string): Promise<void>;
}

export interface WebhookCollection {
    name: string;
    version: string;
    creator: string;

    [hookName: string]: Record<string, Webhook>;
}

export function WebhookPlugin(options: PluginOptions = {}) {
    const collection: WebhookCollection = {
        name: "Webhook Client",
        version: "0.0.1-flux",
        creator: "iFluxo (Fluxo)",
    };

    return createPlugin({
        name: "WebhookClient",

        client: {
            webhook: () => collection,
        },

        ctx: {
            webhook: () => collection,
        },

        async setup(client) {
            let size = 0;

            for (const [hookName, webhookUrl] of Object.entries(options)) {
                const data = getData(webhookUrl);

                if (!data) {
                    client.logger.warn(`[${this.name}-Plugin] WEBHOOK URL for "${hookName}" is not valid!`);

                    continue;
                }

                collection[hookName] = createWebhook(data);

                size++;
            }

            client.logger.info(`[${this.name}-Plugin] ${size} Loaded.`);

            return this;
        },
    });
}

/**
 * Create a webhook instance.
 */
function createWebhook(data: WebhookData): Webhook {
    const { id, token } = data;

    return {
        data,

        /**
         * Send webhook message.
         *
         * String:
         *   send("Hello")
         *
         * Object:
         *   send({ content: "Hello" })
         */
        async send(message) {
            return request(`/webhooks/${id}/${token}?wait=true`, {
                method: "POST",
                body: normalizeMessage(message),
            });
        },

        /**
         * Edit webhook message.
         *
         * String:
         *   edit("Hello")
         *
         * Object:
         *   edit({ content: "Hello" })
         */
        async edit(messageId, message) {
            return request(`/webhooks/${id}/${token}/messages/${messageId}`, {
                method: "PATCH",
                body: normalizeMessage(message),
            });
        },

        /**
         * Fetch webhook message.
         */
        async fetch(messageId) {
            return request(`/webhooks/${id}/${token}/messages/${messageId}`, {
                method: "GET",
            });
        },

        /**
         * Delete webhook message.
         */
        async delete(messageId) {
            await request(`/webhooks/${id}/${token}/messages/${messageId}`, {
                method: "DELETE",
            });
        },
    };
}

/**
 * Convert a string into a Discord message payload.
 *
 * "Hello"
 *
 * becomes:
 *
 * {
 *     content: "Hello"
 * }
 */
function normalizeMessage(message: WebhookMessage): Record<string, unknown> {
    if (typeof message === "string") {
        return {
            content: message,
        };
    }

    return message;
}

/**
 * Manual Discord REST API request.
 */
async function request<T = unknown>(
    path: string,
    options: {
        method: "GET" | "POST" | "PATCH" | "DELETE";

        body?: Record<string, unknown>;
    },
): Promise<T> {
    const response = await fetch(`https://discord.com/api/v10${path}`, {
        method: options.method,

        headers: {
            Accept: "application/json",

            ...(options.body
                ? {
                      "Content-Type": "application/json",
                  }
                : {}),
        },

        ...(options.body
            ? {
                  body: JSON.stringify(options.body),
              }
            : {}),
    });

    /**
     * DELETE success.
     */
    if (response.status === 204) {
        return undefined as T;
    }

    const contentType = response.headers.get("content-type") ?? "";

    let result: unknown;

    if (contentType.includes("application/json")) {
        result = await response.json();
    } else {
        result = await response.text();
    }

    /**
     * Discord API error.
     */
    if (!response.ok) {
        const error = new Error(`Discord API Error ${response.status}: ${response.statusText}`) as Error & {
            status: number;
            body: unknown;
        };

        error.status = response.status;
        error.body = result;

        throw error;
    }

    return result as T;
}

/**
 * Parse Discord webhook URL.
 */
function getData(webhookUrl: string): WebhookData | null {
    if (typeof webhookUrl !== "string" || webhookUrl.length === 0) {
        return null;
    }

    const match = webhookUrl
        .trim()
        .match(/^https?:\/\/(?:ptb\.|canary\.)?discord\.com\/api(?:\/v\d{1,2})?\/webhooks\/(\d{17,20})\/([^/?#\s]+)\/?$/i);

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
    };
}
