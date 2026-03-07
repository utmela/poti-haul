export type Listing = {
  id: string;
  user_id: string | null;
  from_city: string;
  to_city: string;
  price_gel: number;
  capacity_total: number;
  spots_available: number;
  available_from: string;
  driver_display_name: string;
  driver_phone: string;
  vehicle_type: string;
  notes: string | null;
  created_at: string;
};

export type CreateListingInput = Omit<Listing, "id" | "created_at">;

export type Profile = {
  id: string;
  role: "driver" | "admin";
  created_at: string;
};