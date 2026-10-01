import { createPlugin } from "seyfert";

export interface WebhookData {
    id: string;
    token: string;
}

export interface Webhook {
    id: string;
    type: number;
    name: string | null;
    avatar: string | null;
    channel_id: string | null;
    guild_id: string | null;
    application_id: string | null;
    token?: string;
    url?: string;
    [key: string]: unknown;
}

export interface WebhookMessage {
    id: string;
    type: number;
    content: string;
    channel_id: string;
    author?: {
        id: string;
        username: string;
        discriminator: string;
        avatar: string | null;
        bot?: boolean;
    };
    webhook_id?: string;
    [key: string]: unknown;
}

export interface WebhookMessagePayload {
    content?: string;
    username?: string;
    avatar_url?: string;
    tts?: boolean;
    embeds?: unknown[];
    allowed_mentions?: unknown;
    components?: unknown[];
    files?: unknown[];
    attachments?: unknown[];
    flags?: number;
    [key: string]: unknown;
}

export interface WebhookEditPayload {
    content?: string;
    embeds?: unknown[];
    allowed_mentions?: unknown;
    components?: unknown[];
    attachments?: unknown[];
    flags?: number;
    [key: string]: unknown;
}

export interface WebhookEditData {
    name?: string | null;
    avatar?: string | null;
    channel_id?: string;
}

export class WebhookClient {
    private static readonly API_BASE =
        "https://discord.com/api/v10";

    public parseWebhookURL(
        url: string,
    ): WebhookData | null {
        const matches = url.trim().match(
            /^https?:\/\/(?:ptb\.|canary\.)?discord\.com\/api(?:\/v\d{1,2})?\/webhooks\/(\d{17,20})\/([^/?#\s]+)\/?$/i,
        );

        if (!matches) {
            return null;
        }

        const [, id, token] = matches;

        return {
            id,
            token,
        };
    }

    private resolveWebhook(
        webhook: string | WebhookData,
    ): WebhookData {
        if (typeof webhook === "object") {
            if (!webhook.id || !webhook.token) {
                throw new Error("Invalid webhook data.");
            }

            return webhook;
        }

        const parsed = this.parseWebhookURL(webhook);

        if (!parsed) {
            throw new Error("Invalid Discord webhook URL.");
        }

        return parsed;
    }

    private buildURL(
        webhook: WebhookData,
        path = "",
    ): string {
        return `${WebhookClient.API_BASE}/webhooks/${webhook.id}/${webhook.token}${path}`;
    }

    private async request<T>(
        url: string,
        init?: RequestInit,
    ): Promise<T> {
        const response = await fetch(url, {
            ...init,
            headers: {
                Accept: "application/json",
                ...(init?.body
                    ? {
                          "Content-Type": "application/json",
                      }
                    : {}),
                ...init?.headers,
            },
        });

        if (!response.ok) {
            let body: unknown;

            try {
                body = await response.json();
            } catch {
                body = await response.text().catch(() => "");
            }

            const error = new Error(
                `Discord API error ${response.status} ${response.statusText}`,
            ) as Error & {
                status: number;
                body: unknown;
            };

            error.status = response.status;
            error.body = body;

            throw error;
        }

        if (response.status === 204) {
            return undefined as T;
        }

        return response.json() as Promise<T>;
    }

    public async fetch(
        webhook: string | WebhookData,
    ): Promise<Webhook> {
        const data = this.resolveWebhook(webhook);

        return this.request<Webhook>(
            this.buildURL(data),
        );
    }

    public async write(
        webhook: string | WebhookData,
        payload: WebhookMessagePayload,
        options?: {
            wait?: boolean;
            threadId?: string;
            threadName?: string;
        },
    ): Promise<WebhookMessage | void> {
        return this.send(webhook, payload, options);
    }

    public async send(
        webhook: string | WebhookData,
        payload: WebhookMessagePayload,
        options?: {
            wait?: boolean;
            threadId?: string;
            threadName?: string;
        },
    ): Promise<WebhookMessage | void> {
        const data = this.resolveWebhook(webhook);

        const params = new URLSearchParams();

        params.set(
            "wait",
            String(options?.wait ?? true),
        );

        if (options?.threadId) {
            params.set(
                "thread_id",
                options.threadId,
            );
        }

        if (options?.threadName) {
            params.set(
                "thread_name",
                options.threadName,
            );
        }

        return this.request<WebhookMessage | void>(
            `${this.buildURL(data)}?${params}`,
            {
                method: "POST",
                body: JSON.stringify(payload),
            },
        );
    }

    public async edit(
        webhook: string | WebhookData,
        payload: WebhookEditData,
    ): Promise<Webhook> {
        const data = this.resolveWebhook(webhook);

        return this.request<Webhook>(
            this.buildURL(data),
            {
                method: "PATCH",
                body: JSON.stringify(payload),
            },
        );
    }

    public async delete(
        webhook: string | WebhookData,
    ): Promise<void> {
        const data = this.resolveWebhook(webhook);

        await this.request<void>(
            this.buildURL(data),
            {
                method: "DELETE",
            },
        );
    }

    public async fetchMessage(
        webhook: string | WebhookData,
        messageId: string,
    ): Promise<WebhookMessage> {
        const data = this.resolveWebhook(webhook);

        return this.request<WebhookMessage>(
            this.buildURL(
                data,
                `/messages/${messageId}`,
            ),
        );
    }

    public async editMessage(
        webhook: string | WebhookData,
        messageId: string,
        payload: WebhookEditPayload,
    ): Promise<WebhookMessage> {
        const data = this.resolveWebhook(webhook);

        return this.request<WebhookMessage>(
            this.buildURL(
                data,
                `/messages/${messageId}`,
            ),
            {
                method: "PATCH",
                body: JSON.stringify(payload),
            },
        );
    }

    public async deleteMessage(
        webhook: string | WebhookData,
        messageId: string,
    ): Promise<void> {
        const data = this.resolveWebhook(webhook);

        await this.request<void>(
            this.buildURL(
                data,
                `/messages/${messageId}`,
            ),
            {
                method: "DELETE",
            },
        );
    }
}

export function webhookClientPlugin() {
    const webhookClient = new WebhookClient();

    return createPlugin({
        name: "webhook-client",

        client: {
            webhook: () => webhookClient,
        },

        ctx: {
            webhook: () => webhookClient,
        },

        setup(client) {
            client.logger.info(
                `${this.name} plugin registered!`,
            );
        },
    });
}