"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getListings, deleteListing } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Listing } from "@/lib/types";

const T = {
  en: {
    search: "Search", reset: "Clear", destination: "Destination", minGel: "Price from", maxGel: "Price to",
    onlySpots: "With free spots", hideExpired: "Hide expired",
    postListing: "Post listing", signIn: "Sign in", signOut: "Sign out",
    noListings: "No listings found", noListingsSub: "Try adjusting filters or post a new offer.",
    spots: "spots", edit: "Edit", delete: "Delete", confirmDelete: "Delete?",
    availableNow: "Available now", today: "Today", tomorrow: "Tomorrow", upcoming: "Upcoming", expired: "Expired",
    loading: "Loading…", full: "Full", listings: "listings", cities: "cities",
    driver: "Driver", vehicle: "Vehicle", available: "Available", capacity: "Capacity",
    callDriver: "Call", viewDetails: "View details →",
  },
  ka: {
    search: "ძებნა", reset: "გასუფთ.", destination: "დანიშნულება", minGel: "ფასი დან", maxGel: "ფასი მდე",
    onlySpots: "თავისუფალი ადგილებით", hideExpired: "ვადაგასული დამალვა",
    postListing: "+ განცხადება", signIn: "შესვლა", signOut: "გასვლა",
    noListings: "განცხადება ვერ მოიძებნა", noListingsSub: "შეცვალეთ ფილტრები ან ახალი დაამატეთ.",
    spots: "ადგ.", edit: "რედაქტირება", delete: "წაშლა", confirmDelete: "წაშალოთ?",
    availableNow: "ახლავე", today: "დღეს", tomorrow: "ხვალ", upcoming: "მომავალში", expired: "ვადაგასული",
    loading: "იტვირთება…", full: "სავსეა", listings: "განცხ.", cities: "ქალაქი",
    driver: "მძღოლი", vehicle: "ტრანსპორტი", available: "ხელმისაწვდომია", capacity: "ტევადობა",
    callDriver: "ზარი", viewDetails: "დეტალები →",
  },
} as const;
type Lang = keyof typeof T;

function getBadge(ts: string, t: (typeof T)[Lang]) {
  const diffH = (new Date(ts).getTime() - Date.now()) / 36e5;
  if (isNaN(diffH) || diffH < -1) return { label: t.expired,      cls: "bg-gray-100 text-gray-400" };
  if (diffH <= 0)                  return { label: t.availableNow, cls: "bg-[#e85d00] text-white" };
  if (diffH < 24)                  return { label: t.today,        cls: "bg-[#e85d00] text-white" };
  if (diffH < 48)                  return { label: t.tomorrow,     cls: "bg-blue-500 text-white" };
  return                                  { label: t.upcoming,     cls: "bg-gray-200 text-gray-600" };
}

function VehicleIcon({ type, className = "" }: { type: string; className?: string }) {
  const t = type.toLowerCase();

  // Tow truck
  if (t.includes("tow") || t.includes("ამწე")) return (
    <svg className={className} viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="14" width="36" height="18" rx="3" stroke="currentColor" strokeWidth="2.5"/>
      <rect x="38" y="20" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2.5"/>
      <line x1="38" y1="26" x2="58" y2="26" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="12" cy="34" r="4" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="28" cy="34" r="4" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="50" cy="34" r="4" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M2 20h10V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="14" y1="6" x2="14" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="8" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="20" y1="6" x2="20" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );

  // Car carrier
  if (t.includes("carrier") || t.includes("ავტოვოზი")) return (
    <svg className={className} viewBox="0 0 64 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="22" width="56" height="12" rx="2" stroke="currentColor" strokeWidth="2.5"/>
      <rect x="6" y="10" width="22" height="12" rx="2" stroke="currentColor" strokeWidth="2.5"/>
      <rect x="32" y="4" width="22" height="12" rx="2" stroke="currentColor" strokeWidth="2.5"/>
      <line x1="28" y1="10" x2="32" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="36" r="4" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="32" cy="36" r="4" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="50" cy="36" r="4" stroke="currentColor" strokeWidth="2.5"/>
    </svg>
  );

  // Trailer / minivan
  if (t.includes("trailer") || t.includes("მისაბმელი") || t.includes("minivan") || t.includes("მიქსერი")) return (
    <svg className={className} viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="12" width="38" height="20" rx="3" stroke="currentColor" strokeWidth="2.5"/>
      <rect x="40" y="18" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2.5"/>
      <line x1="38" y1="25" x2="40" y2="25" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="14" cy="34" r="4" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="50" cy="34" r="4" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M2 20h8v-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="14" y1="12" x2="26" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  // Generic truck
  return (
    <svg className={className} viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="12" width="44" height="20" rx="3" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M46 18h10l4 6v8H46V18Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
      <circle cx="14" cy="34" r="4" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="32" cy="34" r="4" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="54" cy="34" r="4" stroke="currentColor" strokeWidth="2.5"/>
      <line x1="10" y1="12" x2="10" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="20" y1="12" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// vehicle bg color palette — cycles through calm tones
const BG_COLORS = [
  "from-slate-600 to-slate-800",
  "from-stone-500 to-stone-700",
  "from-zinc-500 to-zinc-700",
  "from-neutral-600 to-neutral-800",
  "from-gray-500 to-gray-700",
];

function formatDate(ts: string) {
  const d = new Date(ts);
  return isNaN(d.getTime()) ? ts : d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function waLink(phone: string) {
  const d = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${d.startsWith("995") ? d : `995${d}`}`;
}

export default function Home() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const parsedMin = useMemo(() => { const n = Number(minGel); return minGel.trim() && isFinite(n) ? n : undefined; }, [minGel]);
  const parsedMax = useMemo(() => { const n = Number(maxGel); return maxGel.trim() && isFinite(n) ? n : undefined; }, [maxGel]);

  const listings = useMemo(() => {
    if (!hideExpired) return allListings;
    // hide anything where available_from is more than 24h in the past
    return allListings.filter(l => new Date(l.available_from).getTime() > Date.now() - 24 * 36e5);
  }, [allListings, hideExpired]);

  const totalSpots = listings.reduce((s, l) => s + l.spots_available, 0);
  const coveredCities = new Set(listings.map(l => l.to_city)).size;

  async function load() {
    setLoading(true);
    const data = await getListings({ destination, minGel: parsedMin, maxGel: parsedMax, onlyWithSpots });
    setAllListings(data);
    setLoading(false);
  }

  function reset() { setDestination(""); setMinGel(""); setMaxGel(""); setOnlyWithSpots(false); setTimeout(load, 0); }

  async function copyPhone(phone: string) {
    try { await navigator.clipboard.writeText(phone); setCopiedPhone(phone); setTimeout(() => setCopiedPhone(null), 1500); } catch {}
  }

  async function handleDelete(id: string) {
    if (!confirm(t.confirmDelete)) return;
    setDeletingId(id);
    try { await deleteListing(id); setAllListings(prev => prev.filter(l => l.id !== id)); }
    finally { setDeletingId(null); }
  }

  function canManage(l: Listing) {
    return !!user && (l.user_id === user.id || profile?.role === "admin");
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  return (
    <main className="min-h-screen bg-[#f0f2f5]">

      {/* ═══ NAVBAR ═══ */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 h-14">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl">🚛</span>
            <span className="font-black text-[17px] tracking-tight text-gray-900 hidden sm:block">
              POTI<span className="text-[#e85d00]">HAUL</span>
            </span>
          </Link>
          <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {!authLoading && (user ? (
              <>
                {profile?.role === "admin" && (
                  <Link href="/admin" className="rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition">👑 Admin</Link>
                )}
                <button onClick={signOut} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition">{t.signOut}</button>
              </>
            ) : (
              <Link href="/auth" className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition">{t.signIn}</Link>
            ))}
            <Link href="/post" className="rounded-md bg-[#e85d00] px-4 py-1.5 text-xs font-bold text-white hover:bg-orange-700 transition">{t.postListing}</Link>
            <button onClick={() => setLang(lang === "en" ? "ka" : "en")}
              className="flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition">
              <img src={lang === "en" ? "https://flagcdn.com/w20/ge.png" : "https://flagcdn.com/w20/gb.png"} width={16} height={12} alt="" className="rounded-sm" />
              {lang === "en" ? "KA" : "EN"}
            </button>
          </div>
        </div>
      </header>

      {/* ═══ FILTER PANEL ═══ */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <form className="flex flex-wrap gap-3 items-end" onSubmit={e => { e.preventDefault(); load(); }}>
            <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{t.destination}</label>
              <input className="rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#e85d00] transition"
                placeholder={lang === "ka" ? "მაგ. თბილისი" : "e.g. Tbilisi"}
                value={destination} onChange={e => setDestination(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1 w-28">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{t.minGel}</label>
              <input className="rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#e85d00] transition"
                placeholder="0" value={minGel} onChange={e => setMinGel(e.target.value)} inputMode="numeric" />
            </div>
            <div className="flex flex-col gap-1 w-28">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{t.maxGel}</label>
              <input className="rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#e85d00] transition"
                placeholder="∞" value={maxGel} onChange={e => setMaxGel(e.target.value)} inputMode="numeric" />
            </div>
            <div className="flex flex-col gap-2 justify-end pb-0.5">
              <label className="flex items-center gap-2 text-sm text-gray-600 font-medium cursor-pointer select-none">
                <input type="checkbox" className="h-4 w-4 accent-[#e85d00]" checked={onlyWithSpots} onChange={e => setOnlyWithSpots(e.target.checked)} />
                {t.onlySpots}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 font-medium cursor-pointer select-none">
                <input type="checkbox" className="h-4 w-4 accent-[#e85d00]" checked={hideExpired} onChange={e => setHideExpired(e.target.checked)} />
                {t.hideExpired}
              </label>
            </div>
            <div className="flex gap-2 items-end pb-0.5">
              <button type="submit" disabled={loading}
                className="rounded-lg bg-[#e85d00] px-7 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50 transition">
                {loading ? "…" : t.search}
              </button>
              <button type="button" onClick={reset}
                className="rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-400 hover:bg-gray-50 transition">✕</button>
            </div>
          </form>
        </div>
      </div>

      {/* ═══ COUNT BAR ═══ */}
      <div className="mx-auto max-w-5xl px-4 py-3">
        <p className="text-sm text-gray-500">
          <b className="text-gray-800">{listings.length}</b> {t.listings}
          <span className="mx-2 text-gray-300">·</span>
          <b className="text-gray-800">{coveredCities}</b> {t.cities}
          <span className="mx-2 text-gray-300">·</span>
          <b className="text-gray-800">{totalSpots}</b> {t.spots}
        </p>
      </div>

      {/* ═══ CARDS ═══ */}
      <div className="mx-auto max-w-5xl px-4 pb-12 grid gap-3">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-sm text-gray-400">
            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            {t.loading}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
            <div className="text-5xl mb-3">🚛</div>
            <div className="text-base font-black text-gray-700">{t.noListings}</div>
            <p className="mt-1 text-sm text-gray-400">{t.noListingsSub}</p>
            <Link href="/post" className="mt-5 inline-flex rounded-lg bg-[#e85d00] px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-700">{t.postListing}</Link>
          </div>
        ) : listings.map((l, i) => {
          const badge = getBadge(l.available_from, t);
          const isExpired = badge.label === t.expired;
          const copied = copiedPhone === l.driver_phone;
          const owned = canManage(l);
          const bgGrad = BG_COLORS[i % BG_COLORS.length];

          return (
            <div key={l.id}
              className={`bg-white rounded-xl overflow-hidden border border-gray-200 transition hover:shadow-md hover:border-gray-300 ${isExpired ? "opacity-50" : ""}`}>
              <div className="flex">

                {/* ── LEFT: photo-style panel ── */}
                <div className={`relative shrink-0 w-36 sm:w-44 bg-gradient-to-br ${bgGrad} flex flex-col items-center justify-center gap-2`}>
                  <VehicleIcon type={l.vehicle_type} className="w-20 h-14 text-white/80" />
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest text-center px-2">{l.vehicle_type}</span>
                  {/* availability badge overlaid like S-VIP */}
                  <div className={`absolute bottom-2.5 left-2.5 rounded-full px-2.5 py-1 text-[11px] font-black ${badge.cls} shadow`}>
                    {badge.label}
                  </div>
                </div>

                {/* ── RIGHT: info ── */}
                <div className="flex flex-1 flex-col justify-between p-4 min-w-0">

                  {/* top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {/* route title */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[17px] font-black text-gray-900 tracking-tight">
                          {l.from_city}
                          <span className="mx-1.5 text-[#e85d00]">→</span>
                          {l.to_city}
                        </h2>
                        {owned && (
                          <span className="text-[11px] font-bold text-violet-500">
                            {profile?.role === "admin" ? "👑 admin" : lang === "ka" ? "✎ შენი" : "✎ yours"}
                          </span>
                        )}
                      </div>

                      {/* meta grid — exactly like myauto specs */}
                      <div className="mt-2.5 grid grid-cols-2 gap-x-8 gap-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                          <span className="font-medium">{l.driver_display_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
                          <span>{formatDate(l.available_from)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="1" y="10" width="14" height="8" rx="1"/><path d="M15 13h4l3 3v4h-7v-7z"/><circle cx="5" cy="20" r="2"/><circle cx="19" cy="20" r="2"/></svg>
                          <span>{l.vehicle_type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          <span>
                            {l.spots_available > 0
                              ? <span className="text-green-600 font-semibold">{l.spots_available}/{l.capacity_total} {t.spots}</span>
                              : <span className="text-red-500 font-semibold">{t.full}</span>
                            }
                          </span>
                        </div>
                      </div>

                      {l.notes && (
                        <div className="mt-2 text-xs text-gray-400 italic">"{l.notes}"</div>
                      )}
                    </div>

                    {/* price + location — top right like myauto */}
                    <div className="shrink-0 text-right">
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{l.driver_phone}</div>
                      <div className="mt-1 text-2xl font-black text-gray-900 tabular-nums">
                        {l.price_gel} <span className="text-[#e85d00] text-xl">₾</span>
                      </div>
                    </div>
                  </div>

                  {/* bottom row — actions like myauto's "Low Price" row */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      {owned && (
                        <>
                          <Link href={`/listing/${l.id}/edit?lang=${lang}`}
                            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition">
                            ✎ {t.edit}
                          </Link>
                          <button onClick={() => handleDelete(l.id)} disabled={deletingId === l.id}
                            className="rounded-md border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-100 disabled:opacity-40 transition">
                            {deletingId === l.id ? "…" : `✕ ${t.delete}`}
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/listing/${l.id}?lang=${lang}`}
                        className="rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50 transition">
                        {t.viewDetails}
                      </Link>
                      <button onClick={() => copyPhone(l.driver_phone)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${copied ? "border-green-300 bg-green-50 text-green-600" : "border-gray-200 text-gray-400 hover:bg-gray-50"}`}>
                        {copied ? "✓" : "📋"}
                      </button>
                      <a href={waLink(l.driver_phone)} target="_blank" rel="noopener noreferrer"
                        className="rounded-lg bg-[#25d366] px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600 transition">
                        WhatsApp
                      </a>
                      <a href={`tel:${l.driver_phone}`}
                        className="rounded-lg bg-[#e85d00] px-4 py-1.5 text-xs font-bold text-white hover:bg-orange-700 transition shadow-sm">
                        {t.callDriver}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* floating post (mobile) */}
      <Link href="/post"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-[#e85d00] px-5 py-3 text-sm font-black text-white shadow-xl hover:bg-orange-700 transition sm:hidden">
        + {t.postListing}
      </Link>
    </main>
  );
}