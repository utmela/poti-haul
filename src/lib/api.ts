import { supabase } from "./supabase";
import type { Listing, CreateListingInput, Profile } from "./types";

const LISTING_FIELDS =
  "id,user_id,from_city,to_city,price_gel,capacity_total,spots_available,available_from,driver_display_name,driver_phone,vehicle_type,notes,created_at";

export type ListingFilters = {
  destination?: string;
  fromCity?: string;
  toCity?: string;
  minGel?: number;
  maxGel?: number;
  onlyWithSpots?: boolean;
  vehicleType?: string;
};

export async function getListings(filters: ListingFilters = {}): Promise<Listing[]> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  let q = supabase
    .from("listings")
    .select(LISTING_FIELDS)
    .gte("available_from", cutoff)
    .order("available_from", { ascending: true });

  if (filters.destination?.trim()) {
    const value = filters.destination.trim();
    q = q.or(`from_city.ilike.%${value}%,to_city.ilike.%${value}%`);
  }

  if (filters.fromCity?.trim()) {
    q = q.ilike("from_city", `%${filters.fromCity.trim()}%`);
  }

  if (filters.toCity?.trim()) {
    q = q.ilike("to_city", `%${filters.toCity.trim()}%`);
  }

  if (typeof filters.minGel === "number" && isFinite(filters.minGel)) {
    q = q.gte("price_gel", filters.minGel);
  }

  if (typeof filters.maxGel === "number" && isFinite(filters.maxGel)) {
    q = q.lte("price_gel", filters.maxGel);
  }

  if (filters.onlyWithSpots) {
    q = q.gt("spots_available", 0);
  }

  if (filters.vehicleType?.trim()) {
    q = q.ilike("vehicle_type", `%${filters.vehicleType.trim()}%`);
  }

  const { data, error } = await q;

  if (error) {
    console.error("getListings:", error);
    return [];
  }

  return (data ?? []) as Listing[];
}

export async function getListingById(id: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getListingById:", error);
    return null;
  }

  return (data ?? null) as Listing | null;
}

export async function createListing(input: CreateListingInput) {
  const { data, error } = await supabase
    .from("listings")
    .insert([input])
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function updateListing(id: string, input: Partial<CreateListingInput>) {
  const { error } = await supabase
    .from("listings")
    .update(input)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteListing(id: string) {
  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("getProfile:", error);
    return null;
  }

  return data as Profile | null;
}