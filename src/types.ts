export type Track = {
  filePath: string;
  fileName: string;
  title: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  trackNo?: number;
  discNo?: number;
  year?: number;
  duration: number;
};

export type Album = {
  folderPath: string;
  title: string;
  artist: string;
  year?: string;
  coverPath: string;
  tracks: Track[];
};

export type RenderOptions = {
  playlist?: string;
};
