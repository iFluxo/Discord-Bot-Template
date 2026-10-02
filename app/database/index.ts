import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import mongoose from "mongoose";

import { Client } from "../structures/Client";

import {
    type SelectCustom,
    type SelectGuild,
    type SelectUser,
    CustomTable,
    GuildTable,
} from "./drizzle.schema";

/**
 * Defines the cache namespaces used by the database layer.
 */
export enum CacheKeys {
    Custom = "custom",
    Guild = "guild",
    Color = "guild:color",
    Locale = "guild:locale",
    Prefix = "guild:prefix",
}

/**
 * Supported database services for latency testing.
 */
export type PingTarget = "drizzle" | "mongodb" | "redis";

/**
 * Represents the result returned by a database ping.
 */
export interface PingResult {
    /**
     * Database service that was tested.
     */
    target: PingTarget;

    /**
     * Measured latency in milliseconds.
     */
    latency: number;

    /**
     * Whether the database responded successfully.
     */
    connected: boolean;
}

/**
 * Provides database access, caching and database health-check
 * functionality for the application.
 */
export class AIODatabase {
    /**
     * Drizzle ORM instance connected to the Turso/libSQL database.
     */
    protected readonly drizzle: drizzle;
    /**
     * Redis client used for application caching.
     */
    readonly cache: Bun.RedisClient;

    /**
     * Mongoose instance used for MongoDB operations.
     */
    readonly mongo = mongoose;

    /**
     * Application client instance.
     */
    protected readonly client: Client;

    /**
     * Creates a new database manager.
     *
     * @param client Application client instance.
     *
     * @throws {Error} If a required environment variable is missing.
     */
    constructor(client: Client) {
        this.client = client;

        const tursoUrl = Bun.env.TursoUrl;
        const tursoAuthToken = Bun.env.TursoAuthToken;
        const redisUrl = Bun.env.RedisUrl;
        const mongoUrl = Bun.env.MongoUrl;

        if (!tursoUrl) {
            throw new Error(
                "Missing environment variable: TursoUrl",
            );
        }

        if (!tursoAuthToken) {
            throw new Error(
                "Missing environment variable: TursoAuthToken",
            );
        }

        if (!redisUrl) {
            throw new Error(
                "Missing environment variable: RedisUrl",
            );
        }

        if (!mongoUrl) {
            throw new Error(
                "Missing environment variable: MongoUrl",
            );
        }

        this.drizzle = drizzle({
            connection: {
                url: tursoUrl,
                authToken: tursoAuthToken,
            },
        });

        this.cache = new Bun.RedisClient(redisUrl);

        mongoose
            .connect(mongoUrl)
            .catch((error) => {
                console.error(
                    "[MongoDB] Connection error:",
                    error,
                );
            });
    }

    /**
     * Generates a namespaced Redis cache key.
     *
     * @param namespace Cache namespace.
     * @param id Resource identifier.
     * @returns A fully qualified Redis key.
     */
    private getCacheKey(
        namespace: CacheKeys,
        id: string,
    ): string {
        return `${namespace}:${id}`;
    }

    /**
     * Retrieves and deserializes a value from Redis.
     *
     * @param namespace Cache namespace.
     * @param id Resource identifier.
     * @returns Cached value or null when the key does not exist.
     */
    private async getCache<T>(
        namespace: CacheKeys,
        id: string,
    ): Promise<T | null> {
        const key = this.getCacheKey(namespace, id);
        const value = await this.cache.get(key);

        if (value === null) {
            return null;
        }

        try {
            return JSON.parse(value) as T;
        } catch {
            return value as T;
        }
    }

    /**
     * Serializes and stores a value in Redis.
     *
     * @param namespace Cache namespace.
     * @param id Resource identifier.
     * @param value Value to cache.
     */
    private async setCache(
        namespace: CacheKeys,
        id: string,
        value: unknown,
    ): Promise<void> {
        const key = this.getCacheKey(namespace, id);

        await this.cache.set(
            key,
            JSON.stringify(value),
        );
    }

    /**
     * Removes a value from Redis.
     *
     * @param namespace Cache namespace.
     * @param id Resource identifier.
     */
    private async deleteCache(
        namespace: CacheKeys,
        id: string,
    ): Promise<void> {
        const key = this.getCacheKey(namespace, id);

        await this.cache.del(key);
    }

    /**
     * Checks database connectivity and measures latency.
     *
     * When no target is specified, Drizzle/Turso is tested.
     *
     * @param target Database service to test.
     * @returns Database health information and latency.
     *
     * @example
     * ```ts
     * await database.ping();
     * await database.ping("drizzle");
     * await database.ping("mongodb");
     * await database.ping("redis");
     * ```
     */
    public async ping(
        target: PingTarget = "drizzle",
    ): Promise<PingResult> {
        const start = performance.now();

        try {
            switch (target) {
                case "mongodb": {
                    if (
                        mongoose.connection.readyState !== 1
                    ) {
                        throw new Error(
                            "MongoDB is not connected",
                        );
                    }

                    await mongoose.connection.db?.command({
                        ping: 1,
                    });

                    break;
                }

                case "redis": {
                    await this.cache.ping();
                    break;
                }

                case "drizzle": {
                    const payload = {
                        test: "Pong!",
                        timestamp: Date.now(),
                    };

                    await this.drizzle
                        .insert(CustomTable)
                        .values({
                            id: "ping-test",
                            data: payload,
                        })
                        .onConflictDoUpdate({
                            target: CustomTable.id,
                            set: {
                                data: payload,
                            },
                        });

                    await this.drizzle
                        .select()
                        .from(CustomTable)
                        .where(
                            eq(
                                CustomTable.id,
                                "ping-test",
                            ),
                        );

                    await this.drizzle
                        .delete(CustomTable)
                        .where(
                            eq(
                                CustomTable.id,
                                "ping-test",
                            ),
                        );

                    break;
                }

                default: {
                    throw new Error(
                        `Unsupported ping target: ${target}`,
                    );
                }
            }

            return {
                target,
                latency: Math.round(
                    performance.now() - start,
                ),
                connected: true,
            };
        } catch {
            return {
                target,
                latency: Math.round(
                    performance.now() - start,
                ),
                connected: false,
            };
        }
    }

    /**
     * Retrieves all custom records.
     *
     * @returns All custom database records.
     */
    public async getCustoms(): Promise<SelectCustom[]> {
        return this.drizzle
            .select()
            .from(CustomTable);
    }

    /**
     * Retrieves all guild records.
     *
     * @returns All guild database records.
     */
    public async getGuilds(): Promise<SelectGuild[]> {
        return this.drizzle
            .select()
            .from(GuildTable);
    }

    /**
     * Creates or updates a custom record.
     *
     * @param id Custom record identifier.
     * @param data Custom record data.
     */
    private async upsertCustom(
        id: SelectCustom["id"],
        data: SelectCustom["data"],
    ): Promise<void> {
        await this.drizzle
            .insert(CustomTable)
            .values({
                id,
                data,
            })
            .onConflictDoUpdate({
                target: CustomTable.id,
                set: {
                    data,
                },
            });
    }

    /**
     * Adds data to an existing custom value.
     *
     * Arrays are appended, numbers are added together and
     * plain objects are merged. If no previous value exists,
     * the provided data becomes the new value.
     *
     * @param id Custom record identifier.
     * @param data Data to add.
     * @returns The resulting custom value.
     */
    public async addCustom(
        id: SelectCustom["id"],
        data: SelectCustom["data"],
    ): Promise<SelectCustom["data"]> {
        const oldData = await this.getCustom(id);

        let newData: SelectCustom["data"];

        if (Array.isArray(oldData)) {
            newData = [
                ...oldData,
                data,
            ] as SelectCustom["data"];
        } else if (
            typeof oldData === "number" &&
            typeof data === "number"
        ) {
            newData = (
                oldData + data
            ) as SelectCustom["data"];
        } else if (
            typeof oldData === "object" &&
            oldData !== null &&
            typeof data === "object" &&
            data !== null &&
            !Array.isArray(oldData) &&
            !Array.isArray(data)
        ) {
            newData = {
                ...oldData,
                ...data,
            } as SelectCustom["data"];
        } else {
            newData = data;
        }

        await this.upsertCustom(id, newData);

        await this.setCache(
            CacheKeys.Custom,
            id,
            newData,
        );

        return newData;
    }

    /**
     * Retrieves a custom value from cache or the database.
     *
     * @param id Custom record identifier.
     * @returns Custom data or null when it does not exist.
     */
    public async getCustom(
        id: SelectCustom["id"],
    ): Promise<SelectCustom["data"] | null> {
        const cached =
            await this.getCache<SelectCustom["data"]>(
                CacheKeys.Custom,
                id,
            );

        if (cached !== null) {
            return cached;
        }

        const [row] = await this.drizzle
            .select()
            .from(CustomTable)
            .where(
                eq(CustomTable.id, id),
            );

        if (!row) {
            return null;
        }

        await this.setCache(
            CacheKeys.Custom,
            id,
            row.data,
        );

        return row.data;
    }

    /**
     * Sets a custom value in both the database and cache.
     *
     * @param id Custom record identifier.
     * @param data Custom data.
     * @returns The stored data.
     */
    public async setCustom(
        id: SelectCustom["id"],
        data: SelectCustom["data"],
    ): Promise<SelectCustom["data"]> {
        await this.upsertCustom(id, data);

        await this.setCache(
            CacheKeys.Custom,
            id,
            data,
        );

        return data;
    }

    /**
     * Deletes a custom value from the database and cache.
     *
     * @param id Custom record identifier.
     */
    public async deleteCustom(
        id: SelectCustom["id"],
    ): Promise<void> {
        await this.drizzle
            .delete(CustomTable)
            .where(
                eq(CustomTable.id, id),
            );

        await this.deleteCache(
            CacheKeys.Custom,
            id,
        );
    }

    /**
     * Creates or updates a guild record.
     *
     * @param id Guild identifier.
     * @param data Guild data to update.
     */
    private async upsertGuild(
        id: SelectGuild["id"],
        data: Partial<Omit<SelectGuild, "id">>,
    ): Promise<void> {
        await this.drizzle
            .insert(GuildTable)
            .values({
                id,
                ...data,
            })
            .onConflictDoUpdate({
                target: GuildTable.id,
                set: {
                    ...data,
                },
            });
    }

    /**
     * Retrieves a guild from cache or the database.
     *
     * @param id Guild identifier.
     * @returns Guild record or null when it does not exist.
     */
    public async getGuildById(
        id: SelectGuild["id"],
    ): Promise<SelectGuild | null> {
        const cached =
            await this.getCache<SelectGuild>(
                CacheKeys.Guild,
                id,
            );

        if (cached !== null) {
            return cached;
        }

        const [row] = await this.drizzle
            .select()
            .from(GuildTable)
            .where(
                eq(GuildTable.id, id),
            );

        if (!row) {
            return null;
        }

        await this.setCache(
            CacheKeys.Guild,
            id,
            row,
        );

        return row;
    }

    /**
     * Retrieves the configured guild color.
     *
     * @param id Guild identifier.
     * @returns Guild color or the application default color.
     */
    public async getColor(
        id: SelectGuild["id"],
    ): Promise<number> {
        const guild = await this.getGuildById(id);

        return (
            guild?.color ??
            this.client.config.color
        );
    }

    /**
     * Retrieves the configured guild locale.
     *
     * @param id Guild identifier.
     * @returns Guild locale or the application default locale.
     */
    public async getLocale(
        id: SelectGuild["id"],
    ): Promise<string> {
        const guild = await this.getGuildById(id);

        return (
            guild?.locale ??
            this.client.config.locale
        );
    }

    /**
     * Retrieves the configured guild prefix.
     *
     * @param id Guild identifier.
     * @returns Guild prefix or the application default prefix.
     */
    public async getPrefix(
        id: SelectGuild["id"],
    ): Promise<string> {
        const guild = await this.getGuildById(id);

        return (
            guild?.prefix ??
            this.client.config.prefix
        );
    }

    /**
     * Updates the guild color and refreshes the guild cache.
     *
     * @param id Guild identifier.
     * @param color New guild color.
     * @returns The configured color.
     */
    public async setColor(
        id: SelectGuild["id"],
        color: SelectGuild["color"],
    ): Promise<number> {
        await this.upsertGuild(id, {
            color,
        });

        const guild = await this.getGuildById(id);

        await this.setCache(
            CacheKeys.Guild,
            id,
            {
                ...(guild ?? { id }),
                color,
            },
        );

        await this.setCache(
            CacheKeys.Color,
            id,
            color,
        );

        return color;
    }

    /**
     * Updates the guild locale and refreshes the guild cache.
     *
     * @param id Guild identifier.
     * @param locale New guild locale.
     * @returns The configured locale.
     */
    public async setLocale(
        id: SelectGuild["id"],
        locale: SelectGuild["locale"],
    ): Promise<string> {
        await this.upsertGuild(id, {
            locale,
        });

        const guild = await this.getGuildById(id);

        await this.setCache(
            CacheKeys.Guild,
            id,
            {
                ...(guild ?? { id }),
                locale,
            },
        );

        await this.setCache(
            CacheKeys.Locale,
            id,
            locale,
        );

        return locale;
    }

    /**
     * Updates the guild prefix and refreshes the guild cache.
     *
     * @param id Guild identifier.
     * @param prefix New guild prefix.
     * @returns The configured prefix.
     */
    public async setPrefix(
        id: SelectGuild["id"],
        prefix: SelectGuild["prefix"],
    ): Promise<string> {
        await this.upsertGuild(id, {
            prefix,
        });

        const guild = await this.getGuildById(id);

        await this.setCache(
            CacheKeys.Guild,
            id,
            {
                ...(guild ?? { id }),
                prefix,
            },
        );

        await this.setCache(
            CacheKeys.Prefix,
            id,
            prefix,
        );

        return prefix;
    }

    /**
     * Deletes a guild and all related cache entries.
     *
     * @param id Guild identifier.
     */
    public async deleteGuild(
        id: SelectGuild["id"],
    ): Promise<void> {
        await this.drizzle
            .delete(GuildTable)
            .where(
                eq(GuildTable.id, id),
            );

        await Promise.all([
            this.deleteCache(
                CacheKeys.Guild,
                id,
            ),
            this.deleteCache(
                CacheKeys.Color,
                id,
            ),
            this.deleteCache(
                CacheKeys.Locale,
                id,
            ),
            this.deleteCache(
                CacheKeys.Prefix,
                id,
            ),
        ]);
    }
}