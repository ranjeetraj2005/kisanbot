import { TaggedWebcamFeed } from "farmbot";

export interface WebcamPanelProps {
  onToggle(): void;
  feeds: TaggedWebcamFeed[];
  init(): void;
  edit(tr: TaggedWebcamFeed, changes: Partial<typeof tr.body>): void;
  save(tr: TaggedWebcamFeed): void;
  destroy(tr: TaggedWebcamFeed): void;
}

export interface WebcamImgProps {
  src: string;
}

export interface WebcamImgState {
  needsFallback: boolean;
  isLoaded: boolean;
}
