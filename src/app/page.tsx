"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getListings } from "@/lib/api";
import type { Listing } from "@/lib/types";

// ── i18n ────────────────────────────────────────────────────────────────────
const T = {
  en: {
    brand: "Poti Transport",
    post: "+ Post transport",
    badge: "Georgia car transport",
    title: "Poti → Car Transport",
    sub: "Find tow truck and car carrier offers from Poti to Georgian cities. Compare prices, available spots, and call drivers directly.",
    activeListings: "Active listings",
    citiesCovered: "Cities covered",
    availableSpots: "Available spots",
    destination: "Destination city (e.g., Tbilisi)",
    minGel: "Min GEL",
    maxGel: "Max GEL",
    onlySpots: "Only with spots",
    search: "Search",
    reset: "Reset",
    refresh: "Refresh",
    refreshing: "Refreshing…",
    noListings: "No listings found",
    noListingsSub: "Try changing filters or post a new transport offer.",
    postListing: "+ Post a listing",
    price: "Price",
    callDriver: "Call driver",
    copyPhone: "Copy phone",
    phoneCopied: "Copied!",
    whatsapp: "WhatsApp",
    viewDetails: "View details",
    spots: "Spots",
    available: "Available",
    notes: "Notes",
    availableNow: "Available now",
    today: "Today",
    tomorrow: "Tomorrow",
    upcoming: "Upcoming",
    expired: "Expired",
    loading: "Loading listings…",
  },
  ka: {
    brand: "პოტის ტრანსპორტი",
    post: "+ განცხადების დამატება",
    badge: "ავტომობილების გადაზიდვა საქართველოში",
    title: "პოტი → ავტომობილის ტრანსპორტი",
    sub: "იპოვეთ მანქანის გადამყვანი სატვირთოები პოტიდან ქართულ ქალაქებამდე. შეადარეთ ფასები, ადგილები და დაუკავშირდით მძღოლებს.",
    activeListings: "აქტიური განცხ.",
    citiesCovered: "ქალაქები",
    availableSpots: "თავისუფალი ადგ.",
    destination: "დანიშნულების ქალაქი (მაგ. თბილისი)",
    minGel: "მინ. ₾",
    maxGel: "მაქს. ₾",
    onlySpots: "მხოლოდ ადგილებით",
    search: "ძებნა",
    reset: "გასუფთავება",
    refresh: "განახლება",
    refreshing: "იტვირთება…",
    noListings: "განცხადება არ მოიძებნა",
    noListingsSub: "შეცვალეთ ფილტრები ან დაამატეთ ახალი განცხადება.",
    postListing: "+ განცხადების დამატება",
    price: "ფასი",
    callDriver: "ზარი მძღოლს",
    copyPhone: "ნომრის კოპირება",
    phoneCopied: "დაკოპირდა!",
    whatsapp: "WhatsApp",
    viewDetails: "დეტალები",
    spots: "ადგილები",
    available: "ხელმისაწვდომია",
    notes: "შენიშვნა",
    availableNow: "ახლა ხელმისაწვდომია",
    today: "დღეს",
    tomorrow: "ხვალ",
    upcoming: "მომავალში",
    expired: "ვადაგასული",
    loading: "იტვირთება…",
  },
} as const;

type Lang = keyof typeof T;

// ── helpers ──────────────────────────────────────────────────────────────────
function formatDate(ts: string) {
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? ts : d.toLocaleString();
}

function getAvailabilityBadge(ts: string, t: (typeof T)[Lang]) {
  const now = new Date();
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return t.upcoming;
  const diffH = (date.getTime() - now.getTime()) / 36e5;
  if (diffH < -1) return t.expired;
  if (diffH <= 0) return t.availableNow;
  if (diffH < 24) return t.today;
  if (diffH < 48) return t.tomorrow;
  return t.upcoming;
}

function waLink(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  const e164 = digits.startsWith("995") ? digits : `995${digits}`;
  return `https://wa.me/${e164}`;
}

// ── component ────────────────────────────────────────────────────────────────
export default function Home() {
  const [lang, setLang] = useState<Lang>("ka");
  const t = T[lang];

  const [destination, setDestination] = useState("");
  const [minGel, setMinGel] = useState("");
  const [maxGel, setMaxGel] = useState("");
  const [onlyWithSpots, setOnlyWithSpots] = useState(false);
  const [hideExpired, setHideExpired] = useState(true);

  const [loading, setLoading] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [allListings, setAllListings] = useState<Listing[]>([]);

  const parsedMin = useMemo(() => {
    const n = Number(minGel);
    return minGel.trim() === "" || !Number.isFinite(n) ? undefined : n;
  }, [minGel]);

  const parsedMax = useMemo(() => {
    const n = Number(maxGel);
    return maxGel.trim() === "" || !Number.isFinite(n) ? undefined : n;
  }, [maxGel]);

  // client-side expiry filter
  const listings = useMemo(() => {
    if (!hideExpired) return allListings;
    const cutoff = Date.now() - 60 * 60 * 1000; // 1 h grace period
    return allListings.filter((l) => new Date(l.available_from).getTime() > cutoff);
  }, [allListings, hideExpired]);

  const totalSpots = listings.reduce((s, l) => s + l.spots_available, 0);
  const coveredCities = new Set(listings.map((l) => l.to_city)).size;

  async function load() {
    setLoading(true);
    const data = await getListings({ destination, minGel: parsedMin, maxGel: parsedMax, onlyWithSpots });
    setAllListings(data);
    setLoading(false);
  }

  function resetFilters() {
    setDestination("");
    setMinGel("");
    setMaxGel("");
    setOnlyWithSpots(false);
  }

  async function copyPhone(phone: string) {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      setTimeout(() => setCopiedPhone(null), 1500);
    } catch {}
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-screen bg-[var(--copart-bg)]">
      {/* ── lang toggle ── */}
      <div className="mx-auto flex max-w-6xl justify-end px-4 pt-3">
        <button
          onClick={() => setLang(lang === "en" ? "ka" : "en")}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-bold text-gray-700 hover:bg-gray-50"
        >
          {lang === "en" ? "🇬🇪 ქართული" : "🇬🇧 English"}
        </button>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        {/* ── Hero ── */}
        <header className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                {t.badge}
              </div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900 md:text-5xl">
                {t.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-gray-600 md:text-base">{t.sub}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/post"
                className="inline-flex items-center rounded-xl bg-[var(--copart-blue)] px-4 py-2 font-bold text-white shadow-sm hover:opacity-90"
              >
                {t.postListing}
              </Link>
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
              >
                {loading ? t.refreshing : t.refresh}
              </button>
            </div>
          </div>

          {/* stats */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: t.activeListings, value: listings.length },
              { label: t.citiesCovered, value: coveredCities },
              { label: t.availableSpots, value: totalSpots },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
                <div className="mt-1 text-2xl font-black text-gray-900">{value}</div>
              </div>
            ))}
          </div>
        </header>

        {/* ── Filters ── */}
        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
          <form
            className="grid gap-3 md:grid-cols-[1.4fr_0.7fr_0.7fr_auto_auto_auto_auto]"
            onSubmit={(e) => { e.preventDefault(); load(); }}
          >
            <input
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
              placeholder={t.destination}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            <input
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
              placeholder={t.minGel}
              value={minGel}
              onChange={(e) => setMinGel(e.target.value)}
              inputMode="numeric"
            />
            <input
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
              placeholder={t.maxGel}
              value={maxGel}
              onChange={(e) => setMaxGel(e.target.value)}
              inputMode="numeric"
            />
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
              <input type="checkbox" checked={onlyWithSpots} onChange={(e) => setOnlyWithSpots(e.target.checked)} />
              {t.onlySpots}
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
              <input type="checkbox" checked={hideExpired} onChange={(e) => setHideExpired(e.target.checked)} />
              {lang === "en" ? "Hide expired" : "ვადაგასული დამალვა"}
            </label>
            <button type="submit" disabled={loading} className="rounded-xl bg-[var(--copart-blue)] px-5 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
              {t.search}
            </button>
            <button
              type="button"
              onClick={() => { resetFilters(); setTimeout(load, 0); }}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50"
            >
              {t.reset}
            </button>
          </form>
        </section>

        {/* ── Listings ── */}
        <section className="mt-6 grid gap-4">
          {loading ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-8 text-sm text-gray-600 shadow-sm">
              {t.loading}
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center shadow-sm">
              <div className="text-lg font-bold text-gray-900">{t.noListings}</div>
              <div className="mt-2 text-sm text-gray-600">{t.noListingsSub}</div>
              <div className="mt-5">
                <Link href="/post" className="inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white hover:bg-gray-800">
                  {t.postListing}
                </Link>
              </div>
            </div>
          ) : (
            listings.map((l) => {
              const badge = getAvailabilityBadge(l.available_from, t);
              const isExpired = badge === t.expired;
              const copied = copiedPhone === l.driver_phone;

              return (
                <div
                  key={l.id}
                  className={`rounded-3xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                    isExpired ? "border-gray-200 opacity-60" : "border-gray-200"
                  }`}
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-black text-gray-900">
                          {l.from_city} → {l.to_city}
                        </h2>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                          isExpired ? "bg-gray-200 text-gray-500" : "bg-gray-100 text-gray-700"
                        }`}>
                          {badge}
                        </span>
                        {l.spots_available > 0 ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                            {l.spots_available} {lang === "en" ? `spot${l.spots_available !== 1 ? "s" : ""} left` : "ადგილი"}
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                            {lang === "en" ? "Full" : "სავსეა"}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 text-sm text-gray-600">
                        {l.driver_display_name} · {l.vehicle_type}
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-gray-700 md:grid-cols-2">
                        <div>{t.spots}: <b>{l.spots_available}</b> / {l.capacity_total}</div>
                        <div>{t.available}: <b>{formatDate(l.available_from)}</b></div>
                      </div>

                      {l.notes && (
                        <div className="mt-3 rounded-2xl bg-gray-50 p-3 text-sm text-gray-700">
                          <span className="font-semibold text-gray-900">{t.notes}:</span> {l.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[220px]">
                      <div className="rounded-2xl bg-[var(--copart-blue)] px-4 py-3 text-center text-white shadow-md">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-300">{t.price}</div>
                        <div className="mt-1 text-3xl font-black">{l.price_gel} ₾</div>
                      </div>

                      <a
                        href={`tel:${l.driver_phone}`}
                        className="rounded-xl bg-[var(--copart-yellow)] px-4 py-3 text-center text-sm font-bold text-black shadow-sm hover:brightness-95"
                      >
                        📞 {t.callDriver}
                      </a>

                      <a
                        href={waLink(l.driver_phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-green-500 px-4 py-3 text-center text-sm font-bold text-white hover:bg-green-600"
                      >
                        💬 {t.whatsapp}
                      </a>

                      <button
                        type="button"
                        onClick={() => copyPhone(l.driver_phone)}
                        className="rounded-xl border border-[var(--copart-blue)] bg-white px-4 py-3 text-sm font-bold text-[var(--copart-blue)] hover:bg-blue-50"
                      >
                        {copied ? t.phoneCopied : t.copyPhone}
                      </button>

                      <Link
                        href={`/listing/${l.id}`}
                        className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-bold text-gray-800 hover:bg-gray-50"
                      >
                        {t.viewDetails}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}