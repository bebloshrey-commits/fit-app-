export type Category = "top" | "bottom" | "shoes" | "jacket" | "accessory";
export const CATEGORIES: Category[] = [
  "top",
  "bottom",
  "shoes",
  "jacket",
  "accessory",
];
export const LABELS: Record<Category, string> = {
  top: "Top",
  bottom: "Trousers",
  shoes: "Shoes",
  jacket: "Jacket",
  accessory: "Accessory",
};
export interface DeliveryInfo {
  verified: boolean;
  latestArrival: string;
  checkedAt: string;
  location: string;
  method: "delivery" | "collect";
  collectionLocation?: string;
}
export interface Product {
  id: string;
  name: string;
  brand: string;
  retailer: string;
  category: Category;
  subcategory: string;
  description: string;
  /** All monetary values are integer pence. */
  price: number;
  currency: "GBP";
  originalPrice: number | null;
  salePrice: number | null;
  imageUrl: string;
  productUrl: string | null;
  affiliateUrl: string | null;
  availableSizes: string[];
  selectedSize?: string;
  colours: string[];
  styleTags: string[];
  occasionTags: string[];
  genderCategory: string;
  material: string;
  rating: number | null;
  reviewCount: number | null;
  availability: boolean;
  stockStatus: "in_stock" | "out_of_stock" | "unknown";
  deliveryEstimate: DeliveryInfo | null;
  deliveryAvailable: boolean | null;
  deliveryCost: number | null;
  /** UK consumer prices normally already include VAT. Null means unverified. */
  taxIncluded?: boolean | null;
  /** Extra tax payable at checkout, in pence. Usually 0 for UK retail. */
  taxAmount?: number | null;
  /** Other unavoidable checkout fees, in pence. */
  mandatoryFees?: number | null;
  /** When the complete checkout-cost data was verified. */
  costVerifiedAt?: string | null;
  expressAvailable: boolean | null;
  clickAndCollectAvailable: boolean | null;
  clickAndCollectLocation: string | null;
  lastUpdated: string;
  source: "demo" | "live";
  region: string;
  sustainability?: {
    verified: boolean;
    certifications: string[];
    recycledPercentage?: number;
  } | null;
}
export interface Profile {
  heightCm?: string;
  weightKg?: string;
  bodyShape?: string;
  fitPreference?: string;
  name: string;
  sizes: Record<Category, string>;
  styles: string[];
  colours: string[];
  avoidColours: string[];
  brands: string;
  avoidBrands: string;
  location: string;
  sustainableMode?: boolean;
}
export interface OwnedItem {
  id: string;
  category: Category;
  name: string;
  colour: string;
}
export interface Weather {
  temperature: number;
  feelsLike: number;
  rainProbability: number;
  precipitation: number;
  wind: number;
  condition: string;
}
export interface BuildRequest {
  profile: Profile;
  occasion: string;
  budget: number;
  deadline: string | null;
  location: string;
  categories: Category[];
  owned: OwnedItem[];
  requireVerifiedDelivery: boolean;
  weather: Weather | null;
  sustainableOnly?: boolean;
}
export interface Scores {
  styleScore: number;
  occasionScore: number;
  colourScore: number;
  weatherScore: number;
  deliveryScore: number;
  versatilityScore: number;
  overallScore: number;
}
export interface Outfit extends Scores {
  id: string;
  name: string;
  products: Product[];
  totalPrice: number;
  budgetRemaining: number;
  request: BuildRequest;
  variant: "Best Overall" | "Cheapest" | "Most Stylish";
  createdAt: string;
}
export interface PlannedOutfit {
  id: string;
  outfitId: string;
  date: string;
  note: string;
  reminderTime: string | null;
}
export interface PackingItem {
  id: string;
  name: string;
  packed: boolean;
}
export interface PackingList {
  id: string;
  tripName: string;
  startsOn: string;
  endsOn: string;
  outfitIds: string[];
  items: PackingItem[];
}
export interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  retailer: string;
  targetPrice: number | null;
  kind: "price_drop" | "restock";
  createdAt: string;
}
export interface PersonalOutfitRating {
  outfitId: string;
  stars: 1 | 2 | 3 | 4 | 5;
  note: string;
  createdAt: string;
}
export const DEFAULT_PROFILE: Profile = {
  name: "",
  sizes: {
    top: "M",
    bottom: "32",
    shoes: "8",
    jacket: "M",
    accessory: "One size",
  },
  styles: ["Minimal"],
  colours: ["Black", "White"],
  avoidColours: [],
  brands: "",
  avoidBrands: "",
  location: "London",
  sustainableMode: false,
};
export const STYLES = [
  "Y2K",
  "Smart streetwear",
  "Minimal",
  "Streetwear",
  "Smart casual",
  "Casual",
  "Preppy",
  "Vintage",
  "Sporty",
  "Formal",
  "Clean",
  "Trendy",
];
export const COLOURS = [
  "Black",
  "White",
  "Grey",
  "Navy",
  "Beige",
  "Olive",
  "Blue",
  "Brown",
  "Pink",
  "Red",
];
export const OCCASIONS = [
  "Casual",
  "Party",
  "Date",
  "Dinner",
  "School",
  "University",
  "Work",
  "Wedding",
  "Holiday",
  "Night out",
  "Gym",
];
export const SIZES: Record<Category, string[]> = {
  top: ["XS", "S", "M", "L", "XL", "XXL"],
  jacket: ["XS", "S", "M", "L", "XL", "XXL"],
  bottom: ["26", "28", "30", "32", "34", "36", "38", "40"],
  shoes: ["3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
  accessory: ["One size"],
};
