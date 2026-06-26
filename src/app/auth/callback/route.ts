import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const lang = searchParams.get("lang") === "en" ? "en" : "ka";
  const next = searchParams.get("next");

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.exchangeCodeForSession(code);
  }

  const destination =
    next?.startsWith("/") && !next.startsWith("//")
      ? new URL(next, origin)
      : new URL("/account", origin);
  destination.searchParams.set("lang", lang);
  if (destination.pathname === "/account") {
    destination.searchParams.set("welcome", "1");
  }

  return NextResponse.redirect(destination);
}
