import * as Sharing from "expo-sharing";
import type { RefObject } from "react";
import type { View } from "react-native";
import { captureRef, releaseCapture } from "react-native-view-shot";
import { OutfitImageSharingService } from "./imageShare";

export async function shareCardImage(
  view: RefObject<View | null>,
): Promise<void> {
  const service = new OutfitImageSharingService<RefObject<View | null>>({
    available: Sharing.isAvailableAsync,
    capture: (ref) =>
      captureRef(ref, { format: "png", quality: 1, result: "tmpfile" }),
    share: (uri) =>
      Sharing.shareAsync(uri, {
        mimeType: "image/png",
        UTI: "public.png",
        dialogTitle: "My FitFind outfit",
      }),
    release: releaseCapture,
  });
  await service.share(view);
}
