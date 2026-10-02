export const config = {
    "cmdPrefixs": process.env.CmdPrefix ?? [...generateCases("ai"), ...generateCases("aichan")]
} as const;

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