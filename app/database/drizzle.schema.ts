import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { Locale, CommandPrefixs, colors } from "#config";

export const CustomTable = sqliteTable("custom", {
    id: text("id").primaryKey(),
    data: text("data", { mode: "json" }).$type<string | number | boolean | object | any[] | null>(),
});

export const GuildTable = sqliteTable("guild", {
    id: text("id").primaryKey(),
    color: integer("color").notNull().default(colors.Primary),
    locale: text("locale").notNull().default(Locale),
    prefix: text("prefixs").array().notNull().default(CommandPrefixs),
});

export type SelectCustom = typeof CustomTable.$inferSelect;
export type SelectGuild = typeof GuildTable.$inferSelect;