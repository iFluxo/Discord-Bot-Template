export default {
    metadata: {
        name: "Indonesian",
        code: "id-ID",
    },

    help: {
        description: "Menampilkan daftar perintah dan bantuan penggunaan.",
        list: {
            title: "Daftar perintah",
            description: (helpSlash?: string) =>
                `Ini adalah daftar perintah. Gunakan ${helpSlash} untuk info perintah yang lebih spesifik.`,
        },
        specific: {
            searching: (cmdName?: string) => `*Mencari perintah dengan nama \`${cmdName}\`...*`,
            notFound: (cmdName?: string) => `Perintah dengan nama \`${cmdName}\` tidak ditemukan.`,
            aliases: (list?: string) => `alias: ${list}`,
            category: (name?: string) => `kategori: \`${name}\``,
            cooldown: (cd?: number) => `cooldown: \`${cd} detik\``,
        },
        options: {
            command: "Masukkan nama perintah.",
        },
    },
    avatar: {
        description: "Menampilkan avatar global dan server pengguna.",
    },
    chat: {
        description: "Mengobrol dengan asisten AI yang ramah.",
    },
    prefix: {
        description: "Atur prefix perintah tambahan atau reset ke bawaan untuk server ini.",
    },
    language: {
        description: "Ubah bahasa bot untuk server ini.",
    },
    ping: {
        title: "Latensi",
        description: "Menampilkan latensi klien, runtime, dan database.",
        client: {
            title: "Klien",
            value: (ping?: number) => `\`${ping ?? 0} ms\``,
        },
        database: {
            title: "Database",
            value: (ping?: number) => `\`${ping ?? 0} ms\``,
        },
        runtime: {
            title: "Runtime",
            value: (ping?: number) => `\`${ping ?? 0} ms\``,
        },
    },
    stats: {
        description: "Menampilkan statistik bot.",
    },
};
