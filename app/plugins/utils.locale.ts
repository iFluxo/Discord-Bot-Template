const localeCache = new Map<string, string>();

export function setLocale(guildId: string, locale: string) {
    localeCache.set(guildId, locale);
}

export function resolveLocale(guildId: string | null | undefined, fallback = "en") {
    return guildId ? (localeCache.get(guildId) ?? fallback) : fallback;
}
