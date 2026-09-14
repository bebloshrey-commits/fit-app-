export interface ImageShareAdapter<T> {
  available(): Promise<boolean>;
  capture(view: T): Promise<string>;
  share(uri: string): Promise<void>;
  release(uri: string): void;
}

/** The adapter owns platform APIs; temporary images never enter persistent storage. */
export class OutfitImageSharingService<T> {
  constructor(private adapter: ImageShareAdapter<T>) {}

  async share(view: T): Promise<void> {
    if (!(await this.adapter.available())) {
      throw new Error(
        "Image sharing is unavailable here. Share the item list instead.",
      );
    }
    const uri = await this.adapter.capture(view);
    try {
      await this.adapter.share(uri);
    } finally {
      this.adapter.release(uri);
    }
  }
}
