export const OG_LABELS = {
  site: 'Gamernes Gamer',
  season: (n: number) => `Sesong ${n}`,
  winner: (n: number) => `Vinner · Sesong ${n}`,
  gameWinner: 'Vinner',
  totals: { seasons: 'Sesonger', games: 'Spill', matches: 'Matcher spilt' },
  career: {
    titles: 'Titler',
    average: 'Snittplassering',
    points: 'Karrierepoeng',
    seasons: 'Sesonger spilt',
  },
  records: { title: 'Rekorder', board: 'Sammenlagtscore' },
  vs: {
    headline: 'Innbyrdes oppgjør: Spill',
    level: (n: number) => `${n} likt`,
    games: (n: number) => `${n} spill`,
  },
};
