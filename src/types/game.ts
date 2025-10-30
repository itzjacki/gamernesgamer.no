export interface Game {
  title: string;
  slug: string;
  thumbnailPath: string;
  chosenBy: string;
  duration: string;
  shortDescription: string;
  longDescription?: string;
  videoEmbedUrl?: string;
}
