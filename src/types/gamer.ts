export interface GamerStats {
  overall: number;
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
  imagePath: string;
  stats?: GamerStats;
}
