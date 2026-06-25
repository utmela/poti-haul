"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRightIcon,
  SearchIcon,
  ShieldIcon,
  UserIcon,
  VehicleGlyph,
} from "@/components/site-icons";
import {
  PENDING_ROLE_KEY,
  type MarketplaceRole,
} from "@/lib/account-role";
import { languageFromSearch, type Lang } from "@/lib/site-data";
import { supabase } from "@/lib/supabase";

const COPY = {
  en: {
    secure: "Secure account access",
    title: "How will you use PotiHaul?",
    subtitle:
      "Choose your role so we can shape the account and actions around what you need.",
    provider: "I offer transport",
    providerDescription:
      "Publish routes, manage availability, and connect with customers.",
    customer: "I need transport",
    customerDescription:
      "Find routes, compare offers, and contact suitable providers.",
    guest: "Continue as guest",
    guestDescription: "Browse all public transport listings without an account.",
    continueProvider: "Continue as service provider",
    continueCustomer: "Continue as customer",
    redirecting: "Redirecting...",
    terms: "By signing in you agree to the service terms.",
  },
  ka: {
    secure: "უსაფრთხო ავტორიზაცია",
    title: "როგორ გამოიყენებ PotiHaul-ს?",
    subtitle:
      "აირჩიე როლი, რათა ანგარიში და მოქმედებები შენს საჭიროებებს მოვარგოთ.",
    provider: "ვთავაზობ ტრანსპორტირების სერვისს",
    providerDescription:
      "განათავსე მარშრუტები, მართე ადგილები და დაუკავშირდი მომხმარებლებს.",
    customer: "ვეძებ ტრანსპორტირების სერვისს",
    customerDescription:
      "იპოვე მარშრუტი, შეადარე შეთავაზებები და დაუკავშირდი გადამზიდავს.",
    guest: "სტუმრად გაგრძელება",
    guestDescription: "დაათვალიერე ყველა საჯარო განცხადება ანგარიშის გარეშე.",
    continueProvider: "გაგრძელება სერვისის მიმწოდებლად",
    continueCustomer: "გაგრძელება მომხმარებლად",
    redirecting: "გადამისამართება...",
    terms: "შესვლით ეთანხმები სერვისის გამოყენების პირობებს.",
  },
} as const;

export default function AuthPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(() =>
    typeof window === "undefined" ? "ka" : languageFromSearch(window.location.search)
  );
  const [selectedRole, setSelectedRole] =
    useState<MarketplaceRole>("provider");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = COPY[lang];

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    localStorage.setItem(PENDING_ROLE_KEY, selectedRole);

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?lang=${lang}`,
      },
    });

    if (authError) {
      localStorage.removeItem(PENDING_ROLE_KEY);
      setError(authError.message);
      setLoading(false);
    }
  }

  function toggleLanguage() {
    const nextLang = lang === "en" ? "ka" : "en";
    setLang(nextLang);
    router.replace(`/auth?lang=${nextLang}`, { scroll: false });
  }

  const roles: Array<{
    role: MarketplaceRole;
    title: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      role: "provider",
      title: t.provider,
      description: t.providerDescription,
      icon: <VehicleGlyph kind="carrier" className="h-7 w-7" />,
    },
    {
      role: "customer",
      title: t.customer,
      description: t.customerDescription,
      icon: <SearchIcon className="h-6 w-6" />,
    },
  ];

  return (
    <main
      lang={lang}
      className="flex min-h-screen items-center justify-center px-4 py-8"
    >
      <div className="w-full max-w-3xl">
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
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-sky-300 hover:bg-white"
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
          <div className="bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.16),transparent_34%),linear-gradient(160deg,#ffffff_0%,#f0f9ff_58%,#fff7ed_100%)] p-6 sm:p-9">
            <div className="flex flex-col items-center text-center">
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
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {roles.map((item) => {
                const active = selectedRole === item.role;

                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setSelectedRole(item.role)}
                    className={`flex items-start gap-4 rounded-[26px] border p-5 text-left transition ${
                      active
                        ? "border-sky-400 bg-sky-50 shadow-[0_14px_34px_rgba(2,132,199,0.13)] ring-4 ring-sky-100"
                        : "border-slate-200 bg-white/90 hover:border-sky-200 hover:bg-white"
                    }`}
                  >
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                        active
                          ? "bg-gradient-to-br from-sky-600 to-blue-700 text-white"
                          : "bg-sky-50 text-sky-700"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-slate-900">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => void signInWithGoogle()}
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-[24px] bg-gradient-to-r from-sky-600 to-blue-700 px-5 py-4 text-sm font-bold text-white shadow-[0_16px_38px_rgba(2,132,199,0.24)] transition hover:from-sky-500 hover:to-blue-600 disabled:opacity-60"
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
              {loading
                ? t.redirecting
                : selectedRole === "provider"
                  ? t.continueProvider
                  : t.continueCustomer}
            </button>

            <Link
              href={`/?lang=${lang}`}
              className="mt-3 flex items-center gap-4 rounded-[24px] border border-slate-200 bg-white/75 p-4 transition hover:border-orange-200 hover:bg-orange-50/60"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <UserIcon className="h-5 w-5" />
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

            <p className="mt-5 text-center text-xs text-slate-400">{t.terms}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
