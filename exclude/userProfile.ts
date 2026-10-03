export const userProfile = {
    id: null,
    nickname: null,
    level: 0,
    exp: 0,
    stats: {
        basic: {
            hp: 0,
            atk: 0,
            def: 0,
            speed: 0,
        },
        advance: {
            crit: 0,
            critImmunity: 0,
            penetrate: 0,
            protect: 0,
            damageIncrease: 0,
            damageReduction: 0,
        },
    },
    couple: null,
    inventory: [],
} as const;
