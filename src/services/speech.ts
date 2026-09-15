import * as Speech from "expo-speech";
import { money } from "../engine";
import { Outfit } from "../models";

export interface SpeechService {
  speakOutfit(outfit: Outfit): Promise<void>;
  stop(): Promise<void>;
}

export class ExpoSpeechService implements SpeechService {
  async speakOutfit(outfit: Outfit) {
    Speech.stop();
    const summary = [
      `${outfit.name}.`,
      `${outfit.request.occasion}, total ${money(outfit.totalPrice)}.`,
      ...outfit.products.map(
        (product) => `${product.name}, ${money(product.price)}.`,
      ),
      `${money(outfit.budgetRemaining)} remaining from your budget.`,
    ].join(" ");
    Speech.speak(summary, { language: "en-GB", rate: 0.95 });
  }
  async stop() {
    Speech.stop();
  }
}

export const speech = new ExpoSpeechService();
