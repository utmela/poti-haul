"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { StylizedDropdown } from "@/components/stylized-dropdown";
import {
  ArrowRightIcon,
  BoardIcon,
  CalendarIcon,
  CapacityIcon,
  CopyIcon,
  DriverIcon,
  EditIcon,
  MapPinIcon,
  MegaphoneIcon,
  MessageIcon,
  PhoneIcon,
  RouteIcon,
  SearchIcon,
  ShieldIcon,
  TrashIcon,
  UserIcon,
  VehicleGlyph,
} from "@/components/site-icons";
import { getAccountRole } from "@/lib/account-role";
import { useAuth } from "@/lib/auth-context";
import { deleteListing, getListings } from "@/lib/api";
import {
  cityLabel,
  FILTER_CITY_OPTIONS,
  FILTER_VEHICLE_OPTIONS,
  languageFromSearch,
  type Lang,
  vehicleKind,
  vehicleLabel,
} from "@/lib/site-data";
import type { Listing } from "@/lib/types";

const T = {
  en: {
    board: "Poti to Georgia transport board",
    search: "Search",
    reset: "Reset filters",
    fromCity: "From city",
    toCity: "To city",
    minGel: "Price from",
    maxGel: "Price to",
    vehicleType: "Vehicle type",
    quickSearch: "Quick search",
    quickSearchPlaceholder: "City, route, or driver",
    postListing: "Post listing",
    signIn: "Sign in",
    signOut: "Sign out",
    admin: "Admin",
    noListings: "No listings found",
    noListingsSub: "Try widening the route, budget, or vehicle filters.",
    spots: "spots",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Delete this listing?",
    availableNow: "Available now",
    today: "Today",
    tomorrow: "Tomorrow",
    upcoming: "Upcoming",
    expired: "Expired",
    loading: "Loading listings...",
    full: "Full",
    listings: "Listings",
    cities: "Cities",
    driver: "Driver",
    vehicle: "Vehicle",
    available: "Available",
    capacity: "Capacity",
    callDriver: "Call driver",
    viewDetails: "View details",
    trustedTransport: "Professional vehicle transport across Georgia",
    trustedTransportSub:
      "Review verified routes from Poti, compare prices quickly, and reach drivers without friction.",
    all: "All",
    allCities: "All cities",
    searchFilters: "Search and filters",
    findTransport: "Find the right transport faster",
    price: "Price",
    advertisement: "Partnership",
    advertiseTitle: "Place your transport business in front of drivers and customers",
    advertiseSub: "Contact us at potihaul@gmail.com for featured placements and sponsor spots.",
    advertiseCta: "Talk to us",
    copied: "Copied",
    copyNumber: "Copy number",
    yours: "Your listing",
  },
  ka: {
    board: "ფოთიდან საქართველოს მასშტაბით",
    search: "ძებნა",
    reset: "ფილტრების გასუფთავება",
    fromCity: "საიდან",
    toCity: "სადამდე",
    minGel: "ფასი დან",
    maxGel: "ფასი მდე",
    vehicleType: "ტრანსპორტის ტიპი",
    quickSearch: "სწრაფი ძებნა",
    quickSearchPlaceholder: "ქალაქი, მარშრუტი ან მძღოლი",
    postListing: "განცხადების დამატება",
    signIn: "შესვლა",
    signOut: "გასვლა",
    admin: "ადმინი",
    noListings: "განცხადება ვერ მოიძებნა",
    noListingsSub: "სცადე უფრო ფართო მარშრუტი, ბიუჯეტი ან ტრანსპორტის ტიპი.",
    spots: "ადგილი",
    edit: "რედაქტირება",
    delete: "წაშლა",
    confirmDelete: "წავშალოთ ეს განცხადება?",
    availableNow: "ახლავე",
    today: "დღეს",
    tomorrow: "ხვალ",
    upcoming: "მომავალში",
    expired: "ვადაგასული",
    loading: "განცხადებები იტვირთება...",
    full: "სავსეა",
    listings: "განცხადებები",
    cities: "ქალაქები",
    driver: "მძღოლი",
    vehicle: "ტრანსპორტი",
    available: "ხელმისაწვდომია",
    capacity: "ტევადობა",
    callDriver: "დარეკვა",
    viewDetails: "დეტალები",
    trustedTransport: "პროფესიონალური ავტოტრანსპორტი მთელი საქართველოსთვის",
    trustedTransportSub:
      "ფოთიდან გამავალი რეალური მარშრუტები, სწრაფი ფასების შედარება და პირდაპირი კავშირი მძღოლებთან.",
    all: "ყველა",
    allCities: "ყველა ქალაქი",
    searchFilters: "ძებნა და ფილტრები",
    findTransport: "იპოვე სწორი ტრანსპორტი უფრო სწრაფად",
    price: "ფასი",
    advertisement: "პარტნიორობა",
    advertiseTitle: "გამოაჩინე შენი სატრანსპორტო ბიზნესი სწორ აუდიტორიასთან",
    advertiseSub: "გამოგვიწერე: potihaul@gmail.com და განვათავსებთ გამორჩეულ რეკლამას.",
    advertiseCta: "დაგვიკავშირდი",
    copied: "დაკოპირდა",
    copyNumber: "ნომრის კოპირება",
    yours: "შენი განცხადება",
  },
} as const;

const VEHICLE_GRADIENTS = [
  "from-sky-700 via-blue-700 to-blue-900",
  "from-blue-600 via-cyan-600 to-sky-800",
  "from-orange-500 via-orange-600 to-rose-600",
  "from-cyan-600 via-sky-700 to-blue-800",
  "from-blue-700 via-indigo-700 to-sky-700",
];

function getBadge(ts: string, t: (typeof T)[Lang]) {
  const diffH = (new Date(ts).getTime() - Date.now()) / 36e5;

  if (Number.isNaN(diffH) || diffH < -1) {
    return {
      label: t.expired,
      cls: "border border-slate-200 bg-white/10 text-slate-200",
    };
  }

  if (diffH <= 0) {
    return {
      label: t.availableNow,
      cls: "border border-orange-300 bg-orange-400 text-slate-950",
    };
  }

  if (diffH < 24) {
    return {
      label: t.today,
      cls: "border border-orange-200 bg-white/15 text-orange-100",
    };
  }

  if (diffH < 48) {
    return {
      label: t.tomorrow,
      cls: "border border-sky-200 bg-sky-400/20 text-sky-100",
    };
  }

  return {
    label: t.upcoming,
    cls: "border border-white/10 bg-white/10 text-white/80",
  };
}

function formatDate(ts: string, lang: Lang) {
  const date = new Date(ts);

  if (Number.isNaN(date.getTime())) {
    return ts;
  }

  return date.toLocaleString(lang === "ka" ? "ka-GE" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function waLink(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits.startsWith("995") ? digits : `995${digits}`}`;
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
          {label}
        </div>
        <div className="truncate text-sm font-semibold text-slate-800">{value}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(() =>
    typeof window === "undefined" ? "ka" : languageFromSearch(window.location.search)
  );

  const t = T[lang];
  const accountRole = getAccountRole(user, profile);
  const canPost = accountRole !== "customer";

  const [destination, setDestination] = useState("");
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [minGel, setMinGel] = useState("");
  const [maxGel, setMaxGel] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const cityOptions = useMemo(
    () =>
      FILTER_CITY_OPTIONS.map((city) => ({
        value: city.value,
        label: lang === "ka" ? city.ka : city.en,
        icon: <MapPinIcon className="h-4 w-4" />,
      })),
    [lang]
  );

  const vehicleOptions = useMemo(
    () =>
      FILTER_VEHICLE_OPTIONS.map((vehicle) => ({
        value: vehicle.kind!,
        label: lang === "ka" ? vehicle.ka : vehicle.en,
        icon: <VehicleGlyph kind={vehicle.kind!} className="h-5 w-5" />,
      })),
    [lang]
  );

  const parsedMin = useMemo(() => {
    const value = Number(minGel);
    return minGel.trim() && Number.isFinite(value) ? value : undefined;
  }, [minGel]);

  const parsedMax = useMemo(() => {
    const value = Number(maxGel);
    return maxGel.trim() && Number.isFinite(value) ? value : undefined;
  }, [maxGel]);

  const listings = useMemo(
    () =>
      allListings.filter(
        (listing) =>
          new Date(listing.available_from).getTime() > Date.now() - 24 * 36e5
      ),
    [allListings]
  );

  async function load() {
    setLoading(true);
    const data = await getListings({
      destination,
      fromCity,
      toCity,
      minGel: parsedMin,
      maxGel: parsedMax,
      vehicleType,
    });
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
    setTimeout(() => {
      void load();
    }, 0);
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
      setAllListings((current) => current.filter((listing) => listing.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  function canManage(listing: Listing) {
    return !!user && (listing.user_id === user.id || profile?.role === "admin");
  }

  function toggleLanguage() {
    const next = lang === "en" ? "ka" : "en";
    setLang(next);
    router.replace(`/?lang=${next}`, { scroll: false });
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fieldLabelCls =
    "mb-2 block text-[12px] font-bold uppercase tracking-[0.18em] text-slate-500";
  const inputCls =
    "h-14 w-full rounded-[24px] border border-slate-200/90 bg-white/90 px-4 text-[15px] font-semibold text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100";

  return (
    <main lang={lang} className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-50 border-b border-white/60 bg-[rgba(248,251,255,0.78)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-2 px-3 sm:h-20 sm:gap-4 sm:px-6">
          <Link href={`/?lang=${lang}`} className="shrink-0">
            <img
              src="/logo.png"
              alt="PotiHaul"
              className="h-11 w-auto max-w-[180px] object-contain sm:h-16 sm:max-w-[280px]"
            />
          </Link>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {!authLoading &&
              (user ? (
                <>
                  {accountRole === "admin" && (
                    <Link
                      href={`/admin?lang=${lang}`}
                      aria-label={t.admin}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-3 text-xs font-bold text-orange-700 transition hover:bg-orange-100 sm:text-sm"
                    >
                      <ShieldIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">{t.admin}</span>
                    </Link>
                  )}
                  <Link
                    href={`/account?lang=${lang}`}
                    aria-label={lang === "ka" ? "შენი ანგარიში" : "Your account"}
                    className="inline-flex h-10 items-center gap-2 rounded-2xl border border-sky-200 bg-white/90 px-2 text-xs font-bold text-sky-800 shadow-[0_8px_22px_rgba(2,132,199,0.08)] transition hover:border-sky-300 hover:bg-sky-50 sm:px-3 sm:text-sm"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <span className="hidden md:inline">
                      {lang === "ka" ? "ანგარიში" : "Account"}
                    </span>
                  </Link>
                </>
              ) : (
                <Link
                  href={`/auth?lang=${lang}`}
                  aria-label={t.signIn}
                  className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-3 text-xs font-semibold text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 sm:text-sm"
                >
                  <UserIcon className="h-4 w-4 text-sky-700" />
                  <span className="hidden sm:inline">{t.signIn}</span>
                </Link>
              ))}

            {canPost && (
              <Link
                href={`/post?lang=${lang}`}
                aria-label={t.postListing}
                className="inline-flex h-10 items-center rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 px-3 text-xs font-bold text-white shadow-[0_12px_30px_rgba(2,132,199,0.24)] transition hover:from-sky-500 hover:to-blue-600 sm:px-4 sm:text-sm"
              >
                <span className="text-base leading-none">+</span>
                <span className="ml-1 hidden sm:inline">{t.postListing}</span>
              </Link>
            )}

            <button
              onClick={toggleLanguage}
              className="flex h-10 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white/80 px-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white sm:gap-2 sm:px-3 sm:text-sm"
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

      <section className="mx-auto max-w-7xl px-4 pb-5 pt-8 sm:px-6">
        <div className="relative overflow-hidden rounded-[36px] border border-white/80 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.22),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.97)_55%,rgba(255,247,237,0.96)_100%)] px-6 py-8 shadow-[0_24px_80px_rgba(2,74,122,0.12)] sm:px-8 sm:py-9">
          <div className="absolute -right-16 top-0 hidden h-64 w-64 rounded-full bg-orange-400/10 blur-3xl lg:block" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700 backdrop-blur">
              <RouteIcon className="h-3.5 w-3.5" />
              {t.board}
            </div>

            <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              {t.trustedTransport}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              {t.trustedTransportSub}
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-30 mx-auto max-w-7xl px-4 pb-6 sm:px-6">
        <div className="rounded-[34px] border border-white/80 bg-white/78 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-slate-500">
                {t.searchFilters}
              </div>
              <div className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                {t.findTransport}
              </div>
            </div>

            <div className="rounded-full bg-gradient-to-r from-sky-600 to-blue-700 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(2,132,199,0.2)]">
              {listings.length} {t.listings}
            </div>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void load();
            }}
            className="grid gap-5"
          >
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <label className={fieldLabelCls}>{t.fromCity}</label>
                <StylizedDropdown
                  value={fromCity}
                  onChange={setFromCity}
                  options={cityOptions}
                  placeholder={t.allCities}
                  buttonIcon={<MapPinIcon className="h-4 w-4" />}
                />
              </div>

              <div className="lg:col-span-3">
                <label className={fieldLabelCls}>{t.toCity}</label>
                <StylizedDropdown
                  value={toCity}
                  onChange={setToCity}
                  options={cityOptions}
                  placeholder={t.allCities}
                  buttonIcon={<RouteIcon className="h-4 w-4" />}
                />
              </div>

              <div className="lg:col-span-2">
                <label className={fieldLabelCls}>{t.minGel}</label>
                <input
                  className={inputCls}
                  placeholder="0"
                  value={minGel}
                  onChange={(event) => setMinGel(event.target.value)}
                  inputMode="numeric"
                />
              </div>

              <div className="lg:col-span-2">
                <label className={fieldLabelCls}>{t.maxGel}</label>
                <input
                  className={inputCls}
                  placeholder="∞"
                  value={maxGel}
                  onChange={(event) => setMaxGel(event.target.value)}
                  inputMode="numeric"
                />
              </div>

              <div className="flex items-end lg:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-[24px] bg-gradient-to-r from-sky-600 to-blue-700 px-5 text-[15px] font-bold text-white shadow-[0_16px_40px_rgba(2,132,199,0.24)] transition hover:from-sky-500 hover:to-blue-600 disabled:opacity-50"
                >
                  <SearchIcon className="h-4 w-4" />
                  {loading ? "..." : t.search}
                </button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <label className={fieldLabelCls}>{t.vehicleType}</label>
                <StylizedDropdown
                  value={vehicleType}
                  onChange={setVehicleType}
                  options={vehicleOptions}
                  placeholder={t.all}
                  buttonIcon={
                    <VehicleGlyph
                      kind={vehicleType ? vehicleKind(vehicleType) : "tow"}
                      className="h-5 w-5"
                    />
                  }
                />
              </div>

              <div className="lg:col-span-4">
                <label className={fieldLabelCls}>{t.quickSearch}</label>
                <input
                  className={inputCls}
                  placeholder={t.quickSearchPlaceholder}
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                />
              </div>

              <div className="flex items-end lg:col-span-2">
                <button
                  type="button"
                  onClick={reset}
                  className="h-14 w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 text-[15px] font-bold text-slate-800 transition hover:border-slate-300 hover:bg-white"
                >
                  {t.reset}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-5 sm:px-6">
        <a
          href="mailto:potihaul@gmail.com?subject=Advertising inquiry"
          className="group flex flex-col gap-4 rounded-[34px] border border-orange-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,237,213,0.9))] px-6 py-5 shadow-[0_16px_50px_rgba(249,115,22,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(249,115,22,0.16)] sm:flex-row sm:items-center sm:justify-between sm:px-8"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-[0_14px_34px_rgba(249,115,22,0.24)]">
              <MegaphoneIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">
                {t.advertisement}
              </div>
              <div className="mt-1 text-base font-black text-slate-950">
                {t.advertiseTitle}
              </div>
              <div className="mt-1 text-sm text-slate-600">{t.advertiseSub}</div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 px-4 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(2,132,199,0.18)] transition group-hover:from-sky-500 group-hover:to-blue-600">
            {t.advertiseCta}
            <ArrowRightIcon className="h-4 w-4" />
          </div>
        </a>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        {loading ? (
          <div className="flex items-center justify-center rounded-[34px] border border-white/80 bg-white/78 py-20 text-sm text-slate-500 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8Z" />
            </svg>
            {t.loading}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-[34px] border border-dashed border-slate-300 bg-white/78 py-20 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-sky-600 to-blue-700 text-white shadow-[0_18px_44px_rgba(2,132,199,0.22)]">
              <BoardIcon className="h-9 w-9" />
            </div>
            <div className="mt-5 text-lg font-black text-slate-800">{t.noListings}</div>
            <p className="mt-2 text-sm text-slate-500">{t.noListingsSub}</p>
            <Link
              href={`/post?lang=${lang}`}
              className="mt-6 inline-flex rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 px-6 py-3 text-sm font-bold text-white transition hover:from-sky-500 hover:to-blue-600"
            >
              + {t.postListing}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {listings.map((listing, index) => {
              const badge = getBadge(listing.available_from, t);
              const isExpired = badge.label === t.expired;
              const copied = copiedPhone === listing.driver_phone;
              const owned = canManage(listing);
              const gradient = VEHICLE_GRADIENTS[index % VEHICLE_GRADIENTS.length];
              const kind = vehicleKind(listing.vehicle_type);
              const displayVehicleType = vehicleLabel(listing.vehicle_type, lang);
              const displayFromCity = cityLabel(listing.from_city, lang);
              const displayToCity = cityLabel(listing.to_city, lang);

              return (
                <article
                  key={listing.id}
                  className={`overflow-hidden rounded-[32px] border border-white/80 bg-white/94 shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_70px_rgba(15,23,42,0.11)] ${
                    isExpired ? "opacity-65" : ""
                  }`}
                >
                  <div className="grid lg:grid-cols-[240px_1fr]">
                    <div
                      className={`relative flex min-h-[210px] flex-col justify-between bg-gradient-to-br ${gradient} p-5 text-white`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${badge.cls}`}
                        >
                          {badge.label}
                        </span>

                        {owned && (
                          <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/90">
                            {profile?.role === "admin" ? "ADMIN" : t.yours}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-1 items-center justify-center">
                        <VehicleGlyph kind={kind} className="h-24 w-28 text-white/85" />
                      </div>

                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                          {t.vehicle}
                        </div>
                        <div className="mt-1 text-base font-bold text-white">
                          {displayVehicleType}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-[2rem]">
                            {displayFromCity}
                            <span className="mx-2 text-orange-500">→</span>
                            {displayToCity}
                          </h2>

                          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <InfoRow
                              label={t.driver}
                              value={listing.driver_display_name}
                              icon={<DriverIcon className="h-4 w-4" />}
                            />
                            <InfoRow
                              label={t.available}
                              value={formatDate(listing.available_from, lang)}
                              icon={<CalendarIcon className="h-4 w-4" />}
                            />
                            <InfoRow
                              label={t.vehicle}
                              value={displayVehicleType}
                              icon={<VehicleGlyph kind={kind} className="h-5 w-5" />}
                            />
                            <InfoRow
                              label={t.capacity}
                              value={
                                listing.spots_available > 0 ? (
                                  <span className="text-emerald-600">
                                    {listing.spots_available}/{listing.capacity_total} {t.spots}
                                  </span>
                                ) : (
                                  <span className="text-red-500">{t.full}</span>
                                )
                              }
                              icon={<CapacityIcon className="h-4 w-4" />}
                            />
                          </div>

                          {listing.notes && (
                            <div className="mt-4 rounded-[24px] border border-orange-100 bg-orange-50 px-4 py-3 text-sm italic text-slate-600">
                              <span aria-hidden="true">“</span>
                              {listing.notes}
                              <span aria-hidden="true">”</span>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 rounded-[26px] border border-slate-200 bg-slate-50 px-5 py-4 lg:min-w-[150px] lg:text-right">
                          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                            {t.price}
                          </div>
                          <div className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                            {listing.price_gel}
                            <span className="ml-1 text-orange-500">₾</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          {owned && (
                            <>
                              <Link
                                href={`/listing/${listing.id}/edit?lang=${lang}`}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                              >
                                <EditIcon className="h-3.5 w-3.5" />
                                {t.edit}
                              </Link>
                              <button
                                onClick={() => void handleDelete(listing.id)}
                                disabled={deletingId === listing.id}
                                className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-40"
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                                {deletingId === listing.id ? "..." : t.delete}
                              </button>
                            </>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/listing/${listing.id}?lang=${lang}`}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            <ArrowRightIcon className="h-3.5 w-3.5" />
                            {t.viewDetails}
                          </Link>
                          <button
                            onClick={() => void copyPhone(listing.driver_phone)}
                            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-bold transition ${
                              copied
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <CopyIcon className="h-3.5 w-3.5" />
                            {copied ? t.copied : t.copyNumber}
                          </button>
                          <a
                            href={waLink(listing.driver_phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-2xl bg-[#25d366] px-4 py-2 text-xs font-bold text-white transition hover:brightness-95"
                          >
                            <MessageIcon className="h-3.5 w-3.5" />
                            WhatsApp
                          </a>
                          <a
                            href={`tel:${listing.driver_phone}`}
                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 px-5 py-2 text-xs font-bold text-white transition hover:from-sky-500 hover:to-blue-600"
                          >
                            <PhoneIcon className="h-3.5 w-3.5" />
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

      {canPost && (
        <Link
          href={`/post?lang=${lang}`}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 px-5 py-3 text-sm font-black text-white shadow-[0_16px_40px_rgba(2,132,199,0.3)] transition hover:from-sky-500 hover:to-blue-600 sm:hidden"
        >
          + {t.postListing}
        </Link>
      )}

      <footer className="border-t border-white/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-center sm:flex-row sm:px-6 sm:text-left">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <img src="/logo.png" alt="PotiHaul" className="h-8 w-auto object-contain" />
          </div>

          <div className="text-sm text-slate-500">
            <a
              href="mailto:potihaul@gmail.com"
              className="font-semibold text-slate-700 transition hover:text-orange-500"
            >
              potihaul@gmail.com
            </a>
          </div>

          <div className="text-xs text-slate-400">
            © {new Date().getFullYear()} PotiHaul. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
