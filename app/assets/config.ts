const {
    ConfigLocale,
    ConfigPrefixs,
    ConfigDevs,
    ConfigGuilds,
} = import.meta.env;

export const config = {
    Locale: ConfigLocale ?? "en-US",
    CommandPrefixs: ConfigPrefixs?.split(",") ?? ["-", "ai", "aichan"],
    Developers: ConfigDevs?.split(",") ?? ["561170896480501790"],
    DevGuilds: ConfigGuilds?.split(",") ?? ["1041813867640131665"],
};

export const colors = {
    Primary: 0xe0e3ff,
    Secondary: 0x5865f2,
};

export const emojis = {
    "#Developer": "🔐",
    "#General": "ℹ️",
    "#Social": "👤",
    "#Utility": "🛠️",
};
