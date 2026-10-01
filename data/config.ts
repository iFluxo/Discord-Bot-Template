export const config = {
    primaryColor: "#000001",
    cmdPrefix: process.env.CmdPrefix ?? [...generateCases("freya"), ...generateCases("fry")]
} as const;

function generateCases(word) {
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