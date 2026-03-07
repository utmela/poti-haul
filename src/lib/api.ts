import { supabase } from "./supabase";
import type { Listing, CreateListingInput } from "./types";

export type ListingFilters = {
  destination?: string;
  minGel?: number;
  maxGel?: number;
  onlyWithSpots?: boolean;
};

export async function getListings(filters: ListingFilters = {}): Promise<Listing[]> {
  let q = supabase
    .from("listings")
    .select(
      "id,from_city,to_city,price_gel,capacity_total,spots_available,available_from,driver_display_name,driver_phone,vehicle_type,notes,created_at"
    )
    .order("available_from", { ascending: true });

  if (filters.destination && filters.destination.trim()) {
    q = q.ilike("to_city", `%${filters.destination.trim()}%`);
  }

  if (typeof filters.minGel === "number" && Number.isFinite(filters.minGel)) {
    q = q.gte("price_gel", filters.minGel);
  }

  if (typeof filters.maxGel === "number" && Number.isFinite(filters.maxGel)) {
    q = q.lte("price_gel", filters.maxGel);
  }

  if (filters.onlyWithSpots) {
    q = q.gt("spots_available", 0);
  }

  const { data, error } = await q;

  if (error) {
    console.error("Supabase getListings error:", {
      message: error.message,
      details: (error as any).details,
      hint: (error as any).hint,
      code: (error as any).code,
    });
    return [];
  }

  return (data ?? []) as Listing[];
}

export async function getListingById(id: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from("listings")
    .select(
      "id,from_city,to_city,price_gel,capacity_total,spots_available,available_from,driver_display_name,driver_phone,vehicle_type,notes,created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Supabase getListingById error:", {
      message: error.message,
      details: (error as any).details,
      hint: (error as any).hint,
      code: (error as any).code,
    });
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

  if (error) {
    console.error("Supabase createListing error:", {
      message: error.message,
      details: (error as any).details,
      hint: (error as any).hint,
      code: (error as any).code,
    });
    throw error;
  }

  return data;
}