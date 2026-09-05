export interface GamerStats {
  focus: number;
  strategy: number;
  mechanics: number;
  mental: number;
  versatility: number;
  consistency: number;
  tactics: number;
}

export interface Gamer {
  name: string;
  nickname: string;
  imagePath: string; // should be 1000px tall
  overallRating: number;
  stats: GamerStats;
}
