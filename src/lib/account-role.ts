import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

export type MarketplaceRole = "provider" | "customer";
export type AccountRole = "guest" | MarketplaceRole | "admin";

export const PENDING_ROLE_KEY = "potihaul-pending-role";

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

  // Existing accounts predate marketplace roles and were transport providers.
  return "provider";
}
