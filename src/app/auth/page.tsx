"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "ka">("ka");
  const ka = lang === "ka";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (e) { setError(e.message); setLoading(false); }
  }

  return (
    <main
      className="flex min-h-[90vh] items-center justify-center p-4"
      style={{ background: "linear-gradient(160deg,#f0f4ff 0%,#f7f8fa 60%,#fff 100%)" }}
    >
      <div className="w-full max-w-sm">
        {/* lang toggle */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setLang(lang === "en" ? "ka" : "en")}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            <img
              src={lang === "en" ? "https://flagcdn.com/w20/ge.png" : "https://flagcdn.com/w20/gb.png"}
              width={18} height={13} alt="" className="rounded-sm"
            />
            {lang === "en" ? "ქართული" : "English"}
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          {/* icon + title */}
          <div className="text-5xl mb-4">🚛</div>
          <h1 className="text-2xl font-black text-gray-900">
            {ka ? "შესვლა" : "Sign in"}
          </h1>
          <p className="mt-2 text-sm text-gray-400 mb-8">
            {ka
              ? "განცხადებების სამართავად შედი Google-ით"
              : "Sign in with Google to manage your listings"}
          </p>

          {/* Google button */}
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60 transition"
          >
            {loading ? (
              <svg className="h-5 w-5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : (
              <img src="https://www.google.com/favicon.ico" width={18} height={18} alt="" />
            )}
            {loading
              ? (ka ? "გადამისამართება…" : "Redirecting…")
              : (ka ? "Google-ით შესვლა" : "Continue with Google")}
          </button>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}

          <p className="mt-6 text-xs text-gray-400">
            {ka
              ? "შესვლით ეთანხმები სერვისის პირობებს"
              : "By signing in you agree to the terms of service"}
          </p>
        </div>
      </div>
    </main>
  );
}