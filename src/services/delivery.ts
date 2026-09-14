import { Product } from "../models";
export type DeliveryStatus =
  | "AVAILABLE_TODAY"
  | "AVAILABLE_TOMORROW"
  | "AVAILABLE_BEFORE_DEADLINE"
  | "DELIVERY_UNCONFIRMED"
  | "UNAVAILABLE_BEFORE_DEADLINE";
export class DeliveryPriorityEngine {
  evaluate(
    product: Product,
    deadline: string | null,
    location: string,
    now = new Date(),
  ): DeliveryStatus {
    const d = product.deliveryEstimate;
    if (
      product.source !== "live" ||
      !d?.verified ||
      d.location.trim().toLowerCase() !== location.trim().toLowerCase() ||
      !Number.isFinite(Date.parse(d.latestArrival)) ||
      !Number.isFinite(Date.parse(d.checkedAt)) ||
      now.getTime() - Date.parse(d.checkedAt) > 3600000 ||
      Date.parse(d.checkedAt) > now.getTime()
    )
      return "DELIVERY_UNCONFIRMED";
    if (
      (d.method === "delivery" && product.deliveryAvailable !== true) ||
      (d.method === "collect" &&
        (!product.clickAndCollectAvailable || !d.collectionLocation))
    )
      return "DELIVERY_UNCONFIRMED";
    const arrival = d.latestArrival.slice(0, 10);
    if (deadline && arrival > deadline) return "UNAVAILABLE_BEFORE_DEADLINE";
    const today = now.toISOString().slice(0, 10);
    const tomorrow = new Date(now.getTime() + 86400000)
      .toISOString()
      .slice(0, 10);
    if (arrival < today) return "DELIVERY_UNCONFIRMED";
    return arrival === today
      ? "AVAILABLE_TODAY"
      : arrival === tomorrow
        ? "AVAILABLE_TOMORROW"
        : "AVAILABLE_BEFORE_DEADLINE";
  }
}
export const deliveryEngine = new DeliveryPriorityEngine();
export const deliveryLabel: Record<DeliveryStatus, string> = {
  AVAILABLE_TODAY: "Verified available today",
  AVAILABLE_TOMORROW: "Verified available tomorrow",
  AVAILABLE_BEFORE_DEADLINE: "Verified delivery estimate",
  DELIVERY_UNCONFIRMED: "Delivery not verified",
  UNAVAILABLE_BEFORE_DEADLINE: "After your deadline",
};
