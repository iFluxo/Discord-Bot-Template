/**
 * Core runtime configuration shared across the application.
 */
export const config = {
    CommandPrefixs: ["-", ...generateCases("ai"), ...generateCases("aichan")],
    Locale: "en-US",
    Developers: ["561170896480501790"],
    DevGuilds: ["1041813867640131665"],
};

/**
 * Brand colors used for embeds and other UI elements.
 */
export const colors = {
    Primary: 0xe0e3ff,
    Secondary: 0x5865f2,
};

/**
 * Emoji identifiers mapped to their category label.
 */
export const emojis = {
    "#Developer": "🔐",
    "#General": "ℹ️",
};

/**
 * Generates every possible upper/lowercase combination of a word.
 * Used to accept prefixed message commands in any letter casing.
 *
 * @param word The base word to generate case variants for.
 * @returns All case permutations of the provided word.
 */
function generateCases(word: string) {
    const result = [];
    const total = 1 << word.length;

    for (let i = 0; i < total; i++) {
        let str = "";

        for (let j = 0; j < word.length; j++) {
            if (i & (1 << j)) {
                str += word[j].toUpperCase();
            } else {
                str += word[j].toLowerCase();
            }
        }

        result.push(str);
    }

    return result;
}
