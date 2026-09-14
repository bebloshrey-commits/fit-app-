import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_PROFILE, Outfit, OwnedItem, Profile } from "./models";
import {
  DEFAULT_SUBSCRIPTION,
  SubscriptionState,
} from "./services/subscription";
export interface AppData {
  version: 2;
  onboarded: boolean;
  profile: Profile;
  saved: Outfit[];
  recent: Outfit[];
  wardrobe: OwnedItem[];
  subscription: SubscriptionState;
}
export const freshData = (): AppData => ({
  version: 2,
  onboarded: false,
  profile: JSON.parse(JSON.stringify(DEFAULT_PROFILE)),
  saved: [],
  recent: [],
  wardrobe: [],
  subscription: { ...DEFAULT_SUBSCRIPTION },
});
export const STORAGE_KEY = "fitfind.data.v2";
export interface StorageDriver {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
export class AppStorage {
  constructor(private driver: StorageDriver) {}
  async load(): Promise<AppData> {
    const raw = await this.driver.getItem(STORAGE_KEY);
    if (!raw) return freshData();
    try {
      const x = JSON.parse(raw);
      if (
        x.version !== 2 ||
        !x.profile?.sizes ||
        !Array.isArray(x.saved) ||
        !Array.isArray(x.recent) ||
        !Array.isArray(x.wardrobe) ||
        !x.subscription
      )
        throw Error();
      return { ...freshData(), ...x };
    } catch {
      throw new Error(
        "Saved data could not be read. Reset local data to recover.",
      );
    }
  }
  async save(data: AppData) {
    await this.driver.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  async deleteAll() {
    await this.driver.removeItem(STORAGE_KEY);
    await this.driver.removeItem("fitfind.saved-outfits.v1");
    await this.driver.removeItem("fitfind.settings.v1");
  }
}
export const storage = new AppStorage(AsyncStorage);
