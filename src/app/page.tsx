"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getListings, deleteListing } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Listing } from "@/lib/types";

const CITIES = [
  "Tbilisi",
  "Kutaisi",
  "Batumi",
  "Zugdidi",
  "Gori",
  "Rustavi",
  "Telavi",
  "Borjomi",
  "Bakuriani",
  "Gudauri",
  "Poti",
];
const T = {
  en: {
    search: "Search",
    reset: "Clear",
    destination: "Anywhere",
    fromCity: "From city",
    toCity: "To city",
    minGel: "Price from",
    maxGel: "Price to",
    vehicleType: "Vehicle type",
    onlySpots: "With free spots",
    hideExpired: "Hide expired",
    postListing: "Post listing",
    signIn: "Sign in",
    signOut: "Sign out",
    noListings: "No listings found",
    noListingsSub: "Try adjusting filters or post a new offer.",
    spots: "spots",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Delete?",
    availableNow: "Available now",
    today: "Today",
    tomorrow: "Tomorrow",
    upcoming: "Upcoming",
    expired: "Expired",
    loading: "Loading…",
    full: "Full",
    listings: "listings",
    cities: "cities",
    driver: "Driver",
    vehicle: "Vehicle",
    available: "Available",
    capacity: "Capacity",
    callDriver: "Call",
    viewDetails: "View details",
    trustedTransport: "Trusted transport listings",
    trustedTransportSub: "Find available drivers, compare prices, and contact them instantly.",
    all: "All",
    searchFilters: "Search & filters",
    findTransport: "Find the right transport faster",
  },
  ka: {
    search: "ძებნა",
    reset: "გასუფთავება",
    destination: "ნებისმიერი",
    fromCity: "საიდან",
    toCity: "სადამდე",
    minGel: "ფასი დან",
    maxGel: "ფასი მდე",
    vehicleType: "ტრანსპორტის ტიპი",
    onlySpots: "თავისუფალი ადგილებით",
    hideExpired: "ვადაგასული დამალვა",
    postListing: "განცხადების დამატება",
    signIn: "შესვლა",
    signOut: "გასვლა",
    noListings: "განცხადება ვერ მოიძებნა",
    noListingsSub: "შეცვალეთ ფილტრები ან დაამატეთ ახალი განცხადება.",
    spots: "ადგილი",
    edit: "რედაქტირება",
    delete: "წაშლა",
    confirmDelete: "წაშალოთ?",
    availableNow: "ახლავე",
    today: "დღეს",
    tomorrow: "ხვალ",
    upcoming: "მომავალში",
    expired: "ვადაგასული",
    loading: "იტვირთება…",
    full: "სავსეა",
    listings: "განცხადება",
    cities: "ქალაქი",
    driver: "მძღოლი",
    vehicle: "ტრანსპორტი",
    available: "ხელმისაწვდომია",
    capacity: "ტევადობა",
    callDriver: "ზარი",
    viewDetails: "დეტალები",
    trustedTransport: "სანდო ტრანსპორტის განცხადებები",
    trustedTransportSub: "იპოვე ხელმისაწვდომი მძღოლები, შეადარე ფასები და დაუკავშირდი პირდაპირ.",
    all: "ყველა",
    searchFilters: "ძებნა და ფილტრები",
    findTransport: "იპოვე სწორი ტრანსპორტი უფრო სწრაფად",
  },
} as const;

type Lang = keyof typeof T;

function getBadge(ts: string, t: (typeof T)[Lang]) {
  const diffH = (new Date(ts).getTime() - Date.now()) / 36e5;

  if (isNaN(diffH) || diffH < -1) {
    return {
      label: t.expired,
      cls: "bg-gray-100 text-gray-500 border border-gray-200",
    };
  }
  if (diffH <= 0) {
    return {
      label: t.availableNow,
      cls: "bg-orange-500 text-white border border-orange-500",
    };
  }
  if (diffH < 24) {
    return {
      label: t.today,
      cls: "bg-orange-50 text-orange-700 border border-orange-200",
    };
  }
  if (diffH < 48) {
    return {
      label: t.tomorrow,
      cls: "bg-blue-50 text-blue-700 border border-blue-200",
    };
  }
  return {
    label: t.upcoming,
    cls: "bg-slate-100 text-slate-700 border border-slate-200",
  };
}

function translateVehicleType(type: string, lang: Lang) {
  const v = type.trim().toLowerCase();

  if (lang === "ka") {
    if (v.includes("tow")) return "ამწე";
    if (v.includes("carrier")) return "ავტოვოზი";
    if (v.includes("trailer")) return "მისაბმელი";
    if (v.includes("truck")) return "სატვირთო";
    if (v.includes("minivan")) return "მინივენი";
    return type;
  }

  if (lang === "en") {
    if (v.includes("ამწე")) return "Tow truck";
    if (v.includes("ავტოვოზი")) return "Carrier";
    if (v.includes("მისაბმელი")) return "Trailer";
    if (v.includes("სატვირთო")) return "Truck";
    if (v.includes("მინივენი")) return "Minivan";
    return type;
  }

  return type;
}

function VehicleIcon({ type, className = "" }: { type: string; className?: string }) {
  const t = type.toLowerCase();

  if (t.includes("tow") || t.includes("ამწე"))
    return (
      <svg className={className} viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="14" width="36" height="18" rx="3" stroke="currentColor" strokeWidth="2.5" />
        <rect x="38" y="20" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2.5" />
        <line x1="38" y1="26" x2="58" y2="26" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="12" cy="34" r="4" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="28" cy="34" r="4" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="50" cy="34" r="4" stroke="currentColor" strokeWidth="2.5" />
        <path d="M2 20h10V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="14" y1="6" x2="14" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="8" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="20" y1="6" x2="20" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );

  if (t.includes("carrier") || t.includes("ავტოვოზი"))
    return (
      <svg className={className} viewBox="0 0 64 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="22" width="56" height="12" rx="2" stroke="currentColor" strokeWidth="2.5" />
        <rect x="6" y="10" width="22" height="12" rx="2" stroke="currentColor" strokeWidth="2.5" />
        <rect x="32" y="4" width="22" height="12" rx="2" stroke="currentColor" strokeWidth="2.5" />
        <line x1="28" y1="10" x2="32" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="36" r="4" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="32" cy="36" r="4" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="50" cy="36" r="4" stroke="currentColor" strokeWidth="2.5" />
      </svg>
    );

  if (t.includes("trailer") || t.includes("მისაბმელი") || t.includes("minivan") || t.includes("მინივენი"))
    return (
      <svg className={className} viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="12" width="38" height="20" rx="3" stroke="currentColor" strokeWidth="2.5" />
        <rect x="40" y="18" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2.5" />
        <line x1="38" y1="25" x2="40" y2="25" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="14" cy="34" r="4" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="50" cy="34" r="4" stroke="currentColor" strokeWidth="2.5" />
        <path d="M2 20h8v-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="14" y1="12" x2="26" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );

  return (
    <svg className={className} viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="12" width="44" height="20" rx="3" stroke="currentColor" strokeWidth="2.5" />
      <path d="M46 18h10l4 6v8H46V18Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="14" cy="34" r="4" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="32" cy="34" r="4" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="54" cy="34" r="4" stroke="currentColor" strokeWidth="2.5" />
      <line x1="10" y1="12" x2="10" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="12" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const VEHICLE_BG = [
  "bg-slate-900",
  "bg-zinc-900",
  "bg-neutral-900",
  "bg-stone-900",
  "bg-gray-900",
];

function formatDate(ts: string) {
  const d = new Date(ts);
  return isNaN(d.getTime())
    ? ts
    : d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function waLink(phone: string) {
  const d = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${d.startsWith("995") ? d : `995${d}`}`;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">{label}</div>
      <div className="mt-1 text-3xl font-black text-gray-950">{value}</div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">{label}</div>
        <div className="truncate text-sm font-semibold text-gray-800">{value}</div>
      </div>
    </div>
  );
}

function translateCity(city: string, lang: Lang) {
  const c = city.trim().toLowerCase();

  if (lang === "ka") {
    const map: Record<string, string> = {
      poti: "ფოთი",
      tbilisi: "თბილისი",
      kutaisi: "ქუთაისი",
      batumi: "ბათუმი",
      rustavi: "რუსთავი",
      zugdidi: "ზუგდიდი",
      gori: "გორი",
      telavi: "თელავი",
      kobuleti: "ქობულეთი",
      senaki: "სენაკი",
      samtredia: "სამტრედია",
      khashuri: "ხაშური",
      borjomi: "ბორჯომი",
      ozurgeti: "ოზურგეთი",
    };

    return map[c] ?? city;
  }

  if (lang === "en") {
    const map: Record<string, string> = {
      "ფოთი": "Poti",
      "თბილისი": "Tbilisi",
      "ქუთაისი": "Kutaisi",
      "ბათუმი": "Batumi",
      "რუსთავი": "Rustavi",
      "ზუგდიდი": "Zugdidi",
      "გორი": "Gori",
      "თელავი": "Telavi",
      "ქობულეთი": "Kobuleti",
      "სენაკი": "Senaki",
      "სამტრედია": "Samtredia",
      "ხაშური": "Khashuri",
      "ბორჯომი": "Borjomi",
      "ოზურგეთი": "Ozurgeti",
    };

    return map[city.trim()] ?? city;
  }

  return city;
}

export default function Home() {
  const { user, profile, loading: authLoading, signOut } = useAuth();

  const [lang, setLang] = useState<Lang>("ka");
  const t = T[lang];

  const [destination, setDestination] = useState("");
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [minGel, setMinGel] = useState("");
  const [maxGel, setMaxGel] = useState("");
  const [onlyWithSpots, setOnlyWithSpots] = useState(false);
  const [hideExpired, setHideExpired] = useState(true);
  const [loading, setLoading] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const parsedMin = useMemo(() => {
    const n = Number(minGel);
    return minGel.trim() && isFinite(n) ? n : undefined;
  }, [minGel]);

  const parsedMax = useMemo(() => {
    const n = Number(maxGel);
    return maxGel.trim() && isFinite(n) ? n : undefined;
  }, [maxGel]);

  const listings = useMemo(() => {
    if (!hideExpired) return allListings;
    return allListings.filter((l) => new Date(l.available_from).getTime() > Date.now() - 24 * 36e5);
  }, [allListings, hideExpired]);

  const totalSpots = listings.reduce((s, l) => s + l.spots_available, 0);
  const coveredCities = new Set(listings.map((l) => l.to_city)).size;

  async function load() {
    setLoading(true);

    const data = await getListings({
      destination,
      fromCity,
      toCity,
      minGel: parsedMin,
      maxGel: parsedMax,
      onlyWithSpots,
      vehicleType,
    } as any);

    setAllListings(data);
    setLoading(false);
  }

  function reset() {
    setDestination("");
    setFromCity("");
    setToCity("");
    setVehicleType("");
    setMinGel("");
    setMaxGel("");
    setOnlyWithSpots(false);
    setHideExpired(true);
    setTimeout(load, 0);
  }

  async function copyPhone(phone: string) {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      setTimeout(() => setCopiedPhone(null), 1500);
    } catch {}
  }

  async function handleDelete(id: string) {
    if (!confirm(t.confirmDelete)) return;
    setDeletingId(id);
    try {
      await deleteListing(id);
      setAllListings((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  function canManage(l: Listing) {
    return !!user && (l.user_id === user.id || profile?.role === "admin");
  }

  useEffect(() => {
    load();
  }, []); // eslint-disable-line

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] text-gray-900">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center shrink-0">
            <img
              src="/logo.png"
              alt="POTIHAUL logo"
              className="h-14 sm:h-16 w-auto max-w-[280px] object-contain"
            />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {!authLoading &&
              (user ? (
                <>
                  {profile?.role === "admin" && (
                    <Link
                      href="/admin"
                      className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs sm:text-sm font-bold text-amber-700 transition hover:bg-amber-100"
                    >
                      👑 Admin
                    </Link>
                  )}

                  <button
                    onClick={signOut}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-xs sm:text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                  >
                    {t.signOut}
                  </button>
                </>
              ) : (
                <Link
                  href="/auth"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-xs sm:text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  {t.signIn}
                </Link>
              ))}

            <Link
              href="/post"
              className="rounded-xl bg-[#ff6a00] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
            >
              + {t.postListing}
            </Link>

            <button
              onClick={() => setLang(lang === "en" ? "ka" : "en")}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs sm:text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              <img
                src={lang === "en" ? "https://flagcdn.com/w20/ge.png" : "https://flagcdn.com/w20/gb.png"}
                width={18}
                height={14}
                alt=""
                className="rounded-sm"
              />
              {lang === "en" ? "KA" : "EN"}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-4 pt-8 sm:px-6">
        <div className="rounded-[28px] border border-gray-200 bg-white px-6 py-8 shadow-[0_10px_40px_rgba(15,23,42,0.05)] sm:px-8">
          <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">
            POTI → Georgia transport board
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-gray-950">
            {t.trustedTransport}
          </h1>

          <p className="mt-3 max-w-3xl text-sm sm:text-base leading-6 text-gray-600">
            {t.trustedTransportSub}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatCard label={t.listings} value={listings.length} />
            <StatCard label={t.cities} value={coveredCities} />
            <StatCard label={t.spots} value={totalSpots} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
  <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.05)] sm:p-6">
    <div className="mb-5">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
        {t.searchFilters}
      </div>
      <div className="mt-1 text-2xl font-black tracking-tight text-gray-950">
        {t.findTransport}
      </div>
    </div>

    <form
      onSubmit={(e) => {
        e.preventDefault();
        load();
      }}
      className="grid gap-5"
    >
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <label className="mb-2 block text-[13px] font-bold tracking-wide text-gray-700">
            {t.fromCity}
          </label>
          <select
            value={fromCity}
            onChange={(e) => setFromCity(e.target.value)}
            className="h-14 w-full rounded-2xl border border-gray-300 bg-white px-4"
          >
            <option value="">
              {lang === "ka" ? "ყველა ქალაქი" : "All cities"}
            </option>

            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3">
          <label className="mb-2 block text-[13px] font-bold tracking-wide text-gray-700">
            {t.toCity}
          </label>
          <select
            value={toCity}
            onChange={(e) => setToCity(e.target.value)}
            className="h-14 w-full rounded-2xl border border-gray-300 bg-white px-4"
          >
            <option value="">
              {lang === "ka" ? "ყველა ქალაქი" : "All cities"}
            </option>

            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="mb-2 block text-[13px] font-bold tracking-wide text-gray-700">
            {t.minGel}
          </label>
          <input
            className="h-14 w-full rounded-2xl border border-gray-300 bg-white px-4 text-[15px] font-medium text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#ff6a00] focus:ring-4 focus:ring-orange-100"
            placeholder="0"
            value={minGel}
            onChange={(e) => setMinGel(e.target.value)}
            inputMode="numeric"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="mb-2 block text-[13px] font-bold tracking-wide text-gray-700">
            {t.maxGel}
          </label>
          <input
            className="h-14 w-full rounded-2xl border border-gray-300 bg-white px-4 text-[15px] font-medium text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#ff6a00] focus:ring-4 focus:ring-orange-100"
            placeholder="∞"
            value={maxGel}
            onChange={(e) => setMaxGel(e.target.value)}
            inputMode="numeric"
          />
        </div>

        <div className="lg:col-span-2 flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="h-14 w-full rounded-2xl bg-[#ff6a00] px-5 text-[15px] font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "…" : t.search}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <label className="mb-2 block text-[13px] font-bold tracking-wide text-gray-700">
            {t.vehicleType}
          </label>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="h-14 w-full rounded-2xl border border-gray-300 bg-white px-4 text-[15px] font-medium text-gray-900 outline-none transition focus:border-[#ff6a00] focus:ring-4 focus:ring-orange-100"
          >
            <option value="">{t.all}</option>
            <option value="truck">{lang === "ka" ? "სატვირთო" : "Truck"}</option>
            <option value="carrier">{lang === "ka" ? "ავტოვოზი" : "Carrier"}</option>
            <option value="tow">{lang === "ka" ? "ამწე" : "Tow truck"}</option>
            <option value="trailer">{lang === "ka" ? "მისაბმელი" : "Trailer"}</option>
            <option value="minivan">{lang === "ka" ? "მინივენი" : "Minivan"}</option>
          </select>
        </div>

        <div className="lg:col-span-3">
          <label className="mb-2 block text-[13px] font-bold tracking-wide text-gray-700">
            {lang === "ka" ? "სწრაფი ძებნა" : "Quick search"}
          </label>
          <input
            className="h-14 w-full rounded-2xl border border-gray-300 bg-white px-4 text-[15px] font-medium text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#ff6a00] focus:ring-4 focus:ring-orange-100"
            placeholder={lang === "ka" ? "ქალაქი ან მარშრუტი" : "City or route"}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>

        <div className="lg:col-span-2 flex items-end">
          <label className="flex h-14 w-full items-center gap-3 rounded-2xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 transition hover:border-gray-400">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#ff6a00]"
              checked={onlyWithSpots}
              onChange={(e) => setOnlyWithSpots(e.target.checked)}
            />
            <span>{t.onlySpots}</span>
          </label>
        </div>

        <div className="lg:col-span-2 flex items-end">
          <label className="flex h-14 w-full items-center gap-3 rounded-2xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 transition hover:border-gray-400">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#ff6a00]"
              checked={hideExpired}
              onChange={(e) => setHideExpired(e.target.checked)}
            />
            <span>{t.hideExpired}</span>
          </label>
        </div>

        <div className="lg:col-span-1 flex items-end">
          <button
            type="button"
            onClick={reset}
            className="h-14 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 text-[15px] font-bold text-gray-800 transition hover:bg-gray-100"
          >
            {t.reset}
          </button>
        </div>
      </div>
    </form>
  </div>
</section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        {loading ? (
          <div className="flex items-center justify-center rounded-[28px] border border-gray-200 bg-white py-20 text-sm text-gray-500 shadow-sm">
            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            {t.loading}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-gray-300 bg-white py-20 text-center shadow-sm">
            <div className="mb-3 text-5xl">🚛</div>
            <div className="text-lg font-black text-gray-800">{t.noListings}</div>
            <p className="mt-2 text-sm text-gray-500">{t.noListingsSub}</p>
            <Link
              href="/post"
              className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              + {t.postListing}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {listings.map((l, i) => {
              const badge = getBadge(l.available_from, t);
              const isExpired = badge.label === t.expired;
              const copied = copiedPhone === l.driver_phone;
              const owned = canManage(l);
              const vehicleBg = VEHICLE_BG[i % VEHICLE_BG.length];
              const displayVehicleType = translateVehicleType(l.vehicle_type, lang);
              const displayFromCity = translateCity(l.from_city, lang);
              const displayToCity = translateCity(l.to_city, lang);

              return (
                <article
                  key={l.id}
                  className={`overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(15,23,42,0.08)] ${
                    isExpired ? "opacity-60" : ""
                  }`}
                >
                  <div className="grid lg:grid-cols-[220px_1fr]">
                    <div className={`relative flex min-h-[190px] flex-col justify-between p-5 text-white ${vehicleBg}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${badge.cls}`}>{badge.label}</span>

                        {owned && (
                          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/90">
                            {profile?.role === "admin" ? "ADMIN" : lang === "ka" ? "შენი" : "YOURS"}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-1 items-center justify-center">
                        <VehicleIcon type={l.vehicle_type} className="h-20 w-24 text-white/80" />
                      </div>

                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                          {t.vehicle}
                        </div>
                        <div className="mt-1 text-base font-bold text-white">{displayVehicleType}</div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                           <h2 className="text-2xl font-black tracking-tight text-gray-950">
                              {displayFromCity}
                                <span className="mx-2 text-orange-500">→</span>
                              {displayToCity}
                            </h2>
                          </div>

                          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <InfoRow
                              label={t.driver}
                              value={l.driver_display_name}
                              icon={
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <circle cx="12" cy="8" r="4" />
                                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                </svg>
                              }
                            />

                            <InfoRow
                              label={t.available}
                              value={formatDate(l.available_from)}
                              icon={
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <rect x="3" y="4" width="18" height="18" rx="2" />
                                  <line x1="3" y1="9" x2="21" y2="9" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                </svg>
                              }
                            />

                            <InfoRow
                              label={t.vehicle}
                              value={displayVehicleType}
                              icon={
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <rect x="1" y="10" width="14" height="8" rx="1" />
                                  <path d="M15 13h4l3 3v4h-7v-7z" />
                                  <circle cx="5" cy="20" r="2" />
                                  <circle cx="19" cy="20" r="2" />
                                </svg>
                              }
                            />

                            <InfoRow
                              label={t.capacity}
                              value={
                                l.spots_available > 0 ? (
                                  <span className="text-emerald-600">
                                    {l.spots_available}/{l.capacity_total} {t.spots}
                                  </span>
                                ) : (
                                  <span className="text-red-500">{t.full}</span>
                                )
                              }
                              icon={
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                  <circle cx="9" cy="7" r="4" />
                                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                              }
                            />
                          </div>

                          {l.notes && (
                            <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm italic text-gray-600">
                              “{l.notes}”
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 lg:text-right">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Price</div>
                          <div className="mt-1 text-3xl font-black tracking-tight text-gray-950">
                            {l.price_gel}
                            <span className="ml-1 text-orange-500">₾</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          {owned && (
                            <>
                              <Link
                                href={`/listing/${l.id}/edit?lang=${lang}`}
                                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
                              >
                                ✎ {t.edit}
                              </Link>
                              <button
                                onClick={() => handleDelete(l.id)}
                                disabled={deletingId === l.id}
                                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-40"
                              >
                                {deletingId === l.id ? "…" : `✕ ${t.delete}`}
                              </button>
                            </>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/listing/${l.id}?lang=${lang}`}
                            className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
                          >
                            {t.viewDetails}
                          </Link>

                          <button
                            onClick={() => copyPhone(l.driver_phone)}
                            className={`rounded-xl border px-4 py-2 text-xs font-bold transition ${
                              copied
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : "border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {copied ? "✓ Copied" : "📋 Copy"}
                          </button>

                          <a
                            href={waLink(l.driver_phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl bg-[#25d366] px-4 py-2 text-xs font-bold text-white transition hover:brightness-95"
                          >
                            WhatsApp
                          </a>

                          <a
                            href={`tel:${l.driver_phone}`}
                            className="rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white transition hover:bg-orange-600"
                          >
                            {t.callDriver}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <Link
        href="/post"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-xl transition hover:bg-orange-600 sm:hidden"
      >
        + {t.postListing}
      </Link>
    </main>
  );
}