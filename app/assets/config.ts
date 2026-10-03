export const config = {
    CommandPrefixs: ["-", ...generateCases("ai"), ...generateCases("aichan")],
    Locale: "en-US",
    Developers: ["561170896480501790"],
    DevGuilds: ["1041813867640131665"],
};

export const colors = {
    Primary: 0xE0E3FF,
    Secondary: 0x5865F2,
};

export const emojis = {
    "#Developer": "🔐",
    "#General": "ℹ️",
};

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
};