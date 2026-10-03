import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { config, colors } from "#config";

/**
 * Stores custom key-value data.
 */
export const CustomTable = sqliteTable("custom", {
    id: text("id").primaryKey(),

    data: text("data", { mode: "json" })
        .$type<string | number | boolean | object | any[] | null>()
        .default(null),
});

/**
 * Stores guild-specific configuration.
 */
export const GuildTable = sqliteTable("guild", {
    id: text("id").primaryKey(),

    color: integer("color")
        .notNull()
        .default(colors.Primary),

    locale: text("locale")
        .notNull()
        .default(config.Locale),

    prefix: text("prefixs", { mode: "json" })
        .$type<string[]>()
        .notNull()
        .default(config.CommandPrefixs),
});

export type SelectCustom = typeof CustomTable.$inferSelect;
export type SelectGuild = typeof GuildTable.$inferSelect;