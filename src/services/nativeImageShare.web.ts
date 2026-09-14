import type { RefObject } from "react";
import type { View } from "react-native";

// Keep native capture libraries out of the web bundle. Web offers the item list.
export async function shareCardImage(
  _view: RefObject<View | null>,
): Promise<void> {
  throw new Error(
    "Image sharing is available in the mobile app. Share the item list here.",
  );
}
