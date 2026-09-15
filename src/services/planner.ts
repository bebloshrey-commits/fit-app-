import { Outfit, PackingList } from "../models";

const uid = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** A deterministic list of unique pieces from chosen outfits. It never claims
 * quantities, weather needs or travel restrictions that were not supplied. */
export function makePackingList(
  tripName: string,
  startsOn: string,
  endsOn: string,
  outfits: Outfit[],
): PackingList {
  const names = new Set<string>();
  outfits.forEach((outfit) => {
    outfit.products.forEach((product) => names.add(product.name));
    outfit.request.owned.forEach((item) => names.add(item.name));
  });
  return {
    id: uid("packing"),
    tripName: tripName.trim() || "My trip",
    startsOn,
    endsOn,
    outfitIds: outfits.map((outfit) => outfit.id),
    items: [...names].map((name) => ({ id: uid("item"), name, packed: false })),
  };
}

export const plannerId = uid;
