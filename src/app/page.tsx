"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getListings } from "@/lib/api";
import type { Listing } from "@/lib/types";

const T = {
  en: {
    badge: "Georgia · Car Transport",
    title: "Poti → Anywhere",
    sub: "Tow trucks & car carriers from Poti to every Georgian city. Compare prices, check spots, contact drivers instantly.",
    activeListings: "Active listings", citiesCovered: "Cities covered", availableSpots: "Open spots",
    destination: "Destination city…", minGel: "Min ₾", maxGel: "Max ₾",
    onlySpots: "With spots", hideExpired: "Hide expired",
    search: "Search", reset: "Reset", refresh: "Refresh", refreshing: "Loading…",
    noListings: "No listings found", noListingsSub: "Try adjusting your filters or post a new offer.",
    postListing: "+ Post a listing", price: "Price",
    callDriver: "Call driver", copyPhone: "Copy number", phoneCopied: "Copied!", whatsapp: "WhatsApp",
    viewDetails: "Details", spots: "Spots", available: "Available", notes: "Notes",
    availableNow: "Now", today: "Today", tomorrow: "Tomorrow", upcoming: "Upcoming", expired: "Expired", loading: "Loading…",
  },
  ka: {
    badge: "საქართველო · ავტოტრანსპორტი",
    title: "პოტი → ნებისმიერ ქალაქში",
    sub: "ამწეები და ავტოვოზები პოტიდან საქართველოს ნებისმიერ ქალაქამდე. შეადარეთ ფასები და დაუკავშირდით მძღოლებს.",
    activeListings: "განცხადებები", citiesCovered: "ქალაქები", availableSpots: "ადგილები",
    destination: "დანიშნულება…", minGel: "მინ ₾", maxGel: "მაქს ₾",
    onlySpots: "ადგილებით", hideExpired: "ვადაგასული",
    search: "ძებნა", reset: "გასუფთ.", refresh: "განახლება", refreshing: "იტვირთება…",
    noListings: "განცხადება ვერ მოიძებნა", noListingsSub: "შეცვალეთ ფილტრები ან დაამატეთ ახალი განცხადება.",
    postListing: "+ განცხადება", price: "ფასი",
    callDriver: "ზარი", copyPhone: "ნომრის კოპირება", phoneCopied: "დაკოპირდა!", whatsapp: "WhatsApp",
    viewDetails: "დეტალები", spots: "ადგილები", available: "ხელმისაწვდომია", notes: "შენიშვნა",
    availableNow: "ახლავე", today: "დღეს", tomorrow: "ხვალ", upcoming: "მომავალში", expired: "ვადაგასული", loading: "იტვირთება…",
  },
} as const;
type Lang = keyof typeof T;

function formatDate(ts: string) {
  const d = new Date(ts);
  return isNaN(d.getTime()) ? ts : d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getBadge(ts: string, t: (typeof T)[Lang]) {
  const diffH = (new Date(ts).getTime() - Date.now()) / 36e5;
  if (isNaN(diffH)) return { label: t.upcoming, color: "bg-blue-100 text-blue-700" };
  if (diffH < -1)  return { label: t.expired,  color: "bg-gray-100 text-gray-500" };
  if (diffH <= 0)  return { label: t.availableNow, color: "bg-emerald-100 text-emerald-700" };
  if (diffH < 24)  return { label: t.today,    color: "bg-amber-100 text-amber-700" };
  if (diffH < 48)  return { label: t.tomorrow, color: "bg-sky-100 text-sky-700" };
  return { label: t.upcoming, color: "bg-blue-100 text-blue-700" };
}

function waLink(phone: string) {
  const d = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${d.startsWith("995") ? d : `995${d}`}`;
}

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

  const parsedMin = useMemo(() => { const n = Number(minGel); return minGel.trim() && isFinite(n) ? n : undefined; }, [minGel]);
  const parsedMax = useMemo(() => { const n = Number(maxGel); return maxGel.trim() && isFinite(n) ? n : undefined; }, [maxGel]);

  const listings = useMemo(() => {
    if (!hideExpired) return allListings;
    return allListings.filter(l => new Date(l.available_from).getTime() > Date.now() - 36e5);
  }, [allListings, hideExpired]);

  const totalSpots = listings.reduce((s, l) => s + l.spots_available, 0);
  const coveredCities = new Set(listings.map(l => l.to_city)).size;

  async function load() {
    setLoading(true);
    const data = await getListings({ destination, minGel: parsedMin, maxGel: parsedMax, onlyWithSpots });
    setAllListings(data);
    setLoading(false);
  }

  function reset() { setDestination(""); setMinGel(""); setMaxGel(""); setOnlyWithSpots(false); }

  async function copyPhone(phone: string) {
    try { await navigator.clipboard.writeText(phone); setCopiedPhone(phone); setTimeout(() => setCopiedPhone(null), 1500); } catch {}
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(160deg,#f0f4ff 0%,#f7f8fa 60%,#fff 100%)" }}>

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden bg-[var(--copart-blue)]">
        <div className="pointer-events-none absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)" }} />
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-block rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/80">
                {t.badge}
              </span>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl">
                {t.title}
              </h1>
              <p className="mt-3 max-w-xl text-sm text-white/70 md:text-base">{t.sub}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/post"
                className="rounded-xl bg-[var(--copart-yellow)] px-5 py-3 text-sm font-black text-black shadow-lg hover:brightness-105 transition">
                {t.postListing}
              </Link>
              <button onClick={load} disabled={loading}
                className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur hover:bg-white/20 disabled:opacity-50 transition">
                {loading ? t.refreshing : t.refresh}
              </button>
              <button onClick={() => setLang(lang === "en" ? "ka" : "en")}
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur hover:bg-white/20 transition flex items-center gap-2">
                <img
                  src={lang === "en"
                    ? "https://flagcdn.com/w20/ge.png"
                    : "https://flagcdn.com/w20/gb.png"}
                  width={20} height={14} alt=""
                  className="rounded-sm"
                />
                {lang === "en" ? "ქართული" : "English"}
              </button>
            </div>
          </div>

          {/* stat pills */}
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { label: t.activeListings, value: listings.length, icon: "📋" },
              { label: t.citiesCovered,  value: coveredCities,   icon: "🗺️" },
              { label: t.availableSpots, value: totalSpots,      icon: "🚗" },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 backdrop-blur">
                <span className="text-xl">{icon}</span>
                <div>
                  <div className="text-xl font-black text-white">{value}</div>
                  <div className="text-xs text-white/60">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">

        {/* ── Filters ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); load(); }}>
            <input
              className="min-w-[160px] flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[var(--copart-blue)] focus:bg-white transition"
              placeholder={t.destination} value={destination} onChange={e => setDestination(e.target.value)} />
            <input
              className="w-24 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[var(--copart-blue)] focus:bg-white transition"
              placeholder={t.minGel} value={minGel} onChange={e => setMinGel(e.target.value)} inputMode="numeric" />
            <input
              className="w-24 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[var(--copart-blue)] focus:bg-white transition"
              placeholder={t.maxGel} value={maxGel} onChange={e => setMaxGel(e.target.value)} inputMode="numeric" />

            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition select-none">
              <input type="checkbox" className="accent-[var(--copart-blue)]" checked={onlyWithSpots} onChange={e => setOnlyWithSpots(e.target.checked)} />
              {t.onlySpots}
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition select-none">
              <input type="checkbox" className="accent-[var(--copart-blue)]" checked={hideExpired} onChange={e => setHideExpired(e.target.checked)} />
              {t.hideExpired}
            </label>

            <button type="submit" disabled={loading}
              className="rounded-xl bg-[var(--copart-blue)] px-6 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition">
              {t.search}
            </button>
            <button type="button" onClick={() => { reset(); setTimeout(load, 0); }}
              className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
              ✕ {t.reset}
            </button>
          </form>
        </div>

        {/* ── Listings ── */}
        <section className="mt-5 grid gap-4">
          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 text-gray-400 shadow-sm">
              <svg className="mr-3 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              {t.loading}
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center shadow-sm">
              <div className="text-4xl">🚛</div>
              <div className="mt-3 text-lg font-bold text-gray-800">{t.noListings}</div>
              <div className="mt-1 text-sm text-gray-500">{t.noListingsSub}</div>
              <Link href="/post" className="mt-5 inline-flex rounded-xl bg-[var(--copart-blue)] px-6 py-3 text-sm font-bold text-white hover:opacity-90">
                {t.postListing}
              </Link>
            </div>
          ) : listings.map(l => {
            const { label: badgeLabel, color: badgeColor } = getBadge(l.available_from, t);
            const isExpired = badgeLabel === t.expired;
            const copied = copiedPhone === l.driver_phone;

            return (
              <div key={l.id}
                className={`group rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${isExpired ? "opacity-50 border-gray-200" : "border-gray-200 hover:border-blue-200"}`}>
                <div className="flex flex-col gap-0 lg:flex-row">

                  {/* left accent bar */}
                  <div className={`w-full rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none lg:w-1.5 flex-shrink-0 ${isExpired ? "bg-gray-200" : "bg-[var(--copart-blue)]"}`} />

                  {/* main content */}
                  <div className="flex flex-1 flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      {/* route + badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-gray-900 md:text-2xl">
                          {l.from_city} <span className="text-[var(--copart-blue)]">→</span> {l.to_city}
                        </h2>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badgeColor}`}>{badgeLabel}</span>
                        {l.spots_available > 0
                          ? <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                              ✓ {l.spots_available} {lang === "en" ? "spot" + (l.spots_available !== 1 ? "s" : "") : "ადგილი"}
                            </span>
                          : <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600 border border-red-200">
                              {lang === "en" ? "Full" : "სავსეა"}
                            </span>
                        }
                      </div>

                      {/* driver + vehicle */}
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-semibold text-gray-700">{l.driver_display_name}</span>
                        <span>·</span>
                        <span>{l.vehicle_type}</span>
                      </div>

                      {/* meta row */}
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                        <span className="text-gray-500">{t.spots}: <span className="font-bold text-gray-800">{l.spots_available}/{l.capacity_total}</span></span>
                        <span className="text-gray-500">{t.available}: <span className="font-bold text-gray-800">{formatDate(l.available_from)}</span></span>
                      </div>

                      {l.notes && (
                        <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
                          💬 {l.notes}
                        </div>
                      )}
                    </div>

                    {/* right panel */}
                    <div className="flex w-full shrink-0 flex-col gap-2 md:w-52">
                      {/* price */}
                      <div className="rounded-xl bg-gradient-to-br from-[var(--copart-blue)] to-blue-700 px-4 py-3 text-center text-white shadow">
                        <div className="text-xs font-semibold uppercase tracking-widest text-blue-200">{t.price}</div>
                        <div className="mt-0.5 text-3xl font-black">{l.price_gel} ₾</div>
                      </div>

                      <a href={`tel:${l.driver_phone}`}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[var(--copart-yellow)] px-4 py-2.5 text-sm font-bold text-black hover:brightness-95 transition">
                        📞 {t.callDriver}
                      </a>

                      <a href={waLink(l.driver_phone)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#25d366] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1ebe5d] transition">
                        💬 {t.whatsapp}
                      </a>

                      <button type="button" onClick={() => copyPhone(l.driver_phone)}
                        className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${copied ? "border-green-300 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}>
                        {copied ? "✓ " + t.phoneCopied : t.copyPhone}
                      </button>

                      <Link href={`/listing/${l.id}?lang=${lang}`}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-center text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
                        {t.viewDetails} →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}