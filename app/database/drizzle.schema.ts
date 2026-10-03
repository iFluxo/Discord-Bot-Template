import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { colors, config } from "#config";

/**
 * Stores custom key-value data.
 */
export const CustomTable = sqliteTable("custom", {
    id: text("id").primaryKey(),

    data: text("data", { mode: "json" }).$type<string | number | boolean | object | unknown[] | null>().default(null),
});

/**
 * Stores guild-specific configuration.
 */
export const GuildTable = sqliteTable("guild", {
    id: text("id").primaryKey(),

    color: integer("color").notNull().default(colors.Primary),

    locale: text("locale").notNull().default(config.Locale),

    prefixs: text("prefixs", { mode: "json" }).$type<string[]>().notNull().default(config.CommandPrefixs),
});

export type SelectCustom = typeof CustomTable.$inferSelect;
export type SelectGuild = typeof GuildTable.$inferSelect;
