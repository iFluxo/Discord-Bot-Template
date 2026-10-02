import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import mongoose from "mongoose";

import { Client } from "../structures/Client"
import { 
    type SelectCustom, 
    type SelectGuild, 
    type SelectUser, 
    CustomTable, 
    GuildTable, 
} from "./drizzle.schema";

export enum CacheKeys {
    Custom = "custom",
    Guild = "guild",
    Color = "guild:color",
    Locale = "guild:locale",
    Prefix = "guild:prefix",
}

export class AIODatabase {
    protected readonly drizzle = drizzle({
        connection: {
            url: process.env.TursoUrl!,
            authToken: process.env.TursoAuthToken!,
        },
    });
    readonly cache: Bun.RedisClient;
    readonly mongo: mongoose;
    protected readonly client: Client;

    constructor(client: Client) {
        this.cache = new Bun.RedisClient(process.env.RedisUrl);
        this.mongoose = mongoose;
        this.client = client;
        mongoose.connect(process.env.MongoUrl).then(() => void 0).catch(console.error);
    }

    public async ping() {
        const payload = { test: "Pong!", timestamp: Date.now() };

        const startWrite = performance.now();
        await this.drizzle.insert(customTable).values({
            id: "ping-test",
            data: payload,
        }).onConflictDoUpdate({
            target: customTable.id,
            set: { data: payload }
        });
        const writeLatency = performance.now() - startWrite;

        const startRead = performance.now();
        await this.drizzle.select().from(customTable).where(eq(customTable.id, "ping-test"));
        const readLatency = performance.now() - startRead;

        const startDelete = performance.now();
        await this.drizzle.delete(customTable).where(eq(customTable.id, "ping-test"));
        const deleteLatency = performance.now() - startDelete;

        return {
            averageLatency: Math.round((writeLatency + readLatency + deleteLatency) / 3),
            writeLatency: Math.round(writeLatency),
            readLatency: Math.round(readLatency),
            deleteLatency: Math.round(deleteLatency),
        };
    }

    public async getCustoms() { return await this.drizzle.select().from(customTable); }
    public async getGuilds() { return await this.drizzle.select().from(guildTable); }
    public async getUsers() { return await this.drizzle.select().from(userTable); }

    private async upsertGuild(id: string, data: Partial<SelectGuild>) {
        await this.drizzle
            .insert(guildTable)
            .values({
                id,
                ...data
            })
            .onConflictDoUpdate({
                target: guildTable.id,
                set: { ...data },
            });
    }

    private async upsertCustom(id: string, data: SelectCustom["data"]) {
        await this.drizzle
            .insert(customTable)
            .values({ id, data })
            .onConflictDoUpdate({
                target: customTable.id,
                set: { data }
            });
    }

    public async addCustom(id: SelectCustom["id"], data: SelectCustom["data"]): Promise<any[] | number | object> {
        let old_data = await this.getCustom(id);
        let new_data: any[] | number | object;

        if (Array.isArray(old_data)) new_data = [...old_data, data];
        else if (typeof old_data === "number") new_data = old_data + (data as number);
        else if (typeof old_data === "object" && old_data !== null) new_data = { ...old_data, ...(data as object) };
        else new_data = data;

        await this.upsertCustom(id, new_data);
        this.cache.set(CacheKeys.Custom, id, new_data);
        return new_data;
    }

    public async getCustom(id: SelectCustom["id"]): Promise<any> {
        const cache = this.cache.get(`${CacheKeys.Custom}:${id}`, id);
        if (cache) return cache as any;

        const [row] = await this.drizzle.select().from(customTable).where(eq(customTable.id, id));
        return row?.data ?? null;
    }

    public async setCustom(id: SelectCustom["id"], data: SelectCustom["data"]): Promise<any> {
        await this.upsertCustom(id, data);
        this.cache.set(`${CacheKeys.Custom}:${id}`, data);
        return data;
    }

    public async getGuildById(id: SelectGuild["id"]): Promise<SelectGuild | null> {
        const cache = this.cache.get(CacheKeys.Guild, id);
        if (cache) return cache as SelectGuild;

        const [row] = await this.drizzle.select().from(guildTable).where(eq(guildTable.id, id));
        if (row) this.cache.set(CacheKeys.Guild, id, row);
        return row ?? null;
    }

    public async getColor(id: SelectGuild["id"]): Promise<number> {
        const guild = await this.getGuildById(id);
        return guild?.color ?? this.client.config.color;
    }

    public async getLocale(id: SelectGuild["id"]): Promise<string> {
        const guild = await this.getGuildById(id);
        return guild?.locale ?? this.client.config.locale;
    }

    public async getPrefix(id: SelectGuild["id"]): Promise<string> {
        const guild = await this.getGuildById(id);
        return guild?.prefix ?? this.client.config.prefix;
    }

    public async setColor(id: SelectGuild["id"], color: SelectGuild["color"]): Promise<number> {
        await this.upsertGuild(id, { color });
        this.cache.set(CacheKeys.Color, id, { color });
        return color;
    }

    public async setLocale(id: SelectGuild["id"], locale: SelectGuild["locale"]): Promise<string> {
        await this.upsertGuild(id, { locale });
        this.cache.set(CacheKeys.Locale, id, { locale });
        return locale;
    }

    public async setPrefix(id: SelectGuild["id"], prefix: SelectGuild["prefix"]): Promise<string> {
        await this.upsertGuild(id, { prefix });
        this.cache.set(CacheKeys.Prefix, id, { prefix });
        return prefix;
    }
}