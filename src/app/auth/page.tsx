"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowRightIcon,
  SearchIcon,
  ShieldIcon,
  UserIcon,
  VehicleGlyph,
} from "@/components/site-icons";
import { languageFromSearch, type Lang } from "@/lib/site-data";
import { supabase } from "@/lib/supabase";

const COPY = {
  en: {
    secure: "Secure account access",
    title: "Sign in when you are ready",
    subtitle:
      "Guests can browse listings freely. You only need an account when you want to publish, manage, or save marketplace activity.",
    signIn: "Continue with Google",
    redirecting: "Redirecting...",
    guest: "Continue as guest",
    guestDescription: "Browse all public transport listings without an account.",
    roleLater: "Role comes later",
    roleLaterDescription:
      "If you decide to post a listing, we will ask whether you offer transport at that moment.",
    terms: "By signing in you agree to the service terms.",
  },
  ka: {
    secure: "უსაფრთხო ავტორიზაცია",
    title: "შედი მაშინ, როცა დაგჭირდება",
    subtitle:
      "სტუმარს შეუძლია განცხადებების ნახვა ანგარიშის გარეშე. ანგარიში საჭიროა მხოლოდ განცხადების დამატების, მართვის ან აქტივობის შენახვისთვის.",
    signIn: "Google-ით გაგრძელება",
    redirecting: "გადამისამართება...",
    guest: "სტუმრად გაგრძელება",
    guestDescription: "დაათვალიერე ყველა საჯარო განცხადება ანგარიშის გარეშე.",
    roleLater: "როლს მოგვიანებით აირჩევ",
    roleLaterDescription:
      "თუ განცხადების დამატებას გადაწყვეტ, მაშინ გკითხავთ სთავაზობ თუ არა ტრანსპორტირების სერვისს.",
    terms: "შესვლით ეთანხმები სერვისის გამოყენების პირობებს.",
  },
} as const;

function safeNextPath(value: string | null) {
  if (!value?.startsWith("/")) {
    return null;
  }

  if (value.startsWith("//")) {
    return null;
  }

  return value;
}
export default function AuthPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(() =>
    typeof window === "undefined" ? "ka" : languageFromSearch(window.location.search)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = COPY[lang];
  const nextPath = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return safeNextPath(new URLSearchParams(window.location.search).get("next"));
  }, []);

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);

    const callbackUrl = new URL(`${location.origin}/auth/callback`);
    callbackUrl.searchParams.set("lang", lang);
    if (nextPath) {
      callbackUrl.searchParams.set("next", nextPath);
    }

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  }

  function toggleLanguage() {
    const nextLang = lang === "en" ? "ka" : "en";
    const nextParam = nextPath ? `&next=${encodeURIComponent(nextPath)}` : "";
    setLang(nextLang);
    router.replace(`/auth?lang=${nextLang}${nextParam}`, { scroll: false });
  }

  return (
    <main
      lang={lang}
      className="flex min-h-screen items-center justify-center px-4 py-8"
    >
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href={`/?lang=${lang}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-sky-700"
          >
            <ArrowRightIcon className="h-4 w-4 rotate-180" />
            PotiHaul
          </Link>

          <button
            onClick={toggleLanguage}
            className="flex min-h-12 items-center gap-2 rounded-[22px] border border-slate-200 bg-white/90 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-sky-300 hover:bg-white"
          >
            <img
              src={
                lang === "en"
                  ? "https://flagcdn.com/w20/ge.png"
                  : "https://flagcdn.com/w20/gb.png"
              }
              width={18}
              height={13}
              alt=""
              className="rounded-sm"
            />
            {lang === "en" ? "ქართული" : "English"}
          </button>
        </div>

        <div className="overflow-hidden rounded-[36px] border border-white/80 bg-white/90 shadow-[0_28px_90px_rgba(2,74,122,0.14)] backdrop-blur">
          <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
            <section className="bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.16),transparent_34%),linear-gradient(160deg,#ffffff_0%,#f0f9ff_58%,#fff7ed_100%)] p-6 sm:p-9">
              <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-sky-600 to-blue-700 text-white shadow-[0_18px_44px_rgba(2,132,199,0.24)]">
                <UserIcon className="h-8 w-8" />
              </div>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold text-orange-700">
                <ShieldIcon className="h-3.5 w-3.5" />
                {t.secure}
              </div>

              <h1 className="mt-4 text-3xl font-black text-slate-950 sm:text-4xl">
                {t.title}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                {t.subtitle}
              </p>

              <button
                onClick={() => void signInWithGoogle()}
                disabled={loading}
                className="mt-7 flex min-h-[58px] w-full items-center justify-center gap-3 rounded-[25px] bg-gradient-to-r from-sky-600 to-blue-700 px-6 py-4 text-base font-bold text-white shadow-[0_16px_38px_rgba(2,132,199,0.24)] transition hover:from-sky-500 hover:to-blue-600 disabled:opacity-60"
              >
                {loading ? (
                  <svg
                    className="h-5 w-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 0 1 8-8v8Z"
                    />
                  </svg>
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-black text-blue-600">
                    G
                  </span>
                )}
                {loading ? t.redirecting : t.signIn}
              </button>

              <Link
                href={`/?lang=${lang}`}
                className="mt-3 flex min-h-[58px] items-center gap-4 rounded-[25px] border border-slate-200 bg-white/75 p-4 transition hover:border-orange-200 hover:bg-orange-50/60"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <SearchIcon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-800">
                    {t.guest}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {t.guestDescription}
                  </span>
                </span>
                <ArrowRightIcon className="h-4 w-4 shrink-0 text-orange-500" />
              </Link>

              {error && (
                <div className="mt-4 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <p className="mt-5 text-xs text-slate-400">{t.terms}</p>
            </section>

            <aside className="border-t border-sky-100 bg-white/72 p-6 lg:border-l lg:border-t-0 sm:p-9">
              <div className="flex h-full flex-col justify-center rounded-[30px] border border-sky-100 bg-sky-50/80 p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white text-sky-700 shadow-[0_14px_32px_rgba(2,132,199,0.12)]">
                  <VehicleGlyph kind="carrier" className="h-9 w-9" />
                </div>
                <h2 className="mt-5 text-2xl font-black text-slate-950">
                  {t.roleLater}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {t.roleLaterDescription}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
