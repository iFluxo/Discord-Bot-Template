import { createPlugin } from "seyfert";

export type PluginOptions = Record<string, string>;

export interface Webhook {
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

export type WebhookCollection = Record<string, Webhook>;

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

                const { id, token } = data;

                hooks[hookName] = {
                    send: async (message) => {
                        return client.webhooks.writeMessage(
                            id,
                            token,
                            message,
                        );
                    },

                    edit: async (messageId, message) => {
                        return client.webhooks.editMessage(
                            id,
                            token,
                            messageId,
                            message,
                        );
                    },

                    fetch: async (messageId) => {
                        return client.webhooks.fetchMessage(
                            id,
                            token,
                            messageId,
                        );
                    },

                    delete: async (messageId) => {
                        return client.webhooks.deleteMessage(
                            id,
                            token,
                            messageId,
                        );
                    },
                };

                size++;
            }

            client.logger.info(
                `[${this.name}-Plugin] ${size} Loaded.`,
            );

            return this;
        },
    });
}

function getData(
    webhookUrl: string,
): { id: string; token: string } | null {
    if (!webhookUrl) {
        return null;
    }

    const match = webhookUrl.trim().match(
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
    };
}