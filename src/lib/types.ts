export type Profile = {
  id: string;
  display_name: string;
  role: "user" | "admin";
  is_seller: boolean;
  student_id: string | null;
  school_email: string | null;
  banned: boolean;
};

export type Listing = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  categories: string[];
  images: string[];
  location_text: string;
  fulfillment: "delivery" | "pickup" | "both";
  delivery_note: string;
  status: "available" | "sold" | "removed";
  sold_at: string | null;
  last_negotiated_at: string | null;
  last_negotiated_by: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export const CATEGORIES = [
  "appliances",
  "furniture",
  "electronics",
  "books",
  "clothing",
  "bikes",
  "other",
] as const;

// Choices when posting. "all" is a plain tag for items that fit no category; the home "All" pill shows every listing regardless.
export const ALL_CATEGORY = "all";
export const LISTING_CATEGORIES = [ALL_CATEGORY, ...CATEGORIES] as const;

export const FULFILLMENT_LABEL: Record<Listing["fulfillment"], string> = {
  delivery: "Seller can deliver",
  pickup: "Buyer picks up",
  both: "Delivery or pick-up",
};

// A listing counts as "being negotiated" for this long after a buyer's last message.
export const NEGOTIATING_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isNegotiating(l: Listing, viewerId?: string | null): boolean {
  if (l.status !== "available" || !l.last_negotiated_at) return false;
  if (viewerId && l.last_negotiated_by === viewerId) return false;
  return Date.now() - new Date(l.last_negotiated_at).getTime() < NEGOTIATING_WINDOW_MS;
}
