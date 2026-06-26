import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

export type MarketplaceRole = "provider" | "customer";
export type AccountRole = "guest" | "member" | MarketplaceRole | "admin";

export function getAccountRole(
  user: User | null,
  profile: Profile | null
): AccountRole {
  if (!user) {
    return "guest";
  }

  if (
    profile?.role === "admin" ||
    user?.app_metadata?.role === "admin" ||
    user?.app_metadata?.is_admin === true
  ) {
    return "admin";
  }

  const metadataRole = user.user_metadata?.marketplace_role;

  if (metadataRole === "customer" || metadataRole === "provider") {
    return metadataRole;
  }

  if (profile?.role === "driver") {
    return "provider";
  }

  return "member";
}
