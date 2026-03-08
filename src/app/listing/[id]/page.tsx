"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getListingById, deleteListing } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Listing } from "@/lib/types";

const T = {
  en: {
    notFound: "Listing not found", back: "Back", price: "Price",
    available: "Available from", capacity: "Capacity", spots: "spots",
    phone: "Driver phone", notes: "Notes", call: "Call driver", whatsapp: "WhatsApp",
    edit: "✎ Edit listing", delete: "🗑 Delete listing", confirmDelete: "Delete this listing?",
    deleting: "Deleting…", route: "Route", driver: "Driver / Service", vehicle: "Vehicle",
  },
  ka: {
    notFound: "განცხადება ვერ მოიძებნა", back: "უკან", price: "ფასი",
    available: "ხელმისაწვდომია", capacity: "ტევადობა", spots: "ადგილი",
    phone: "მძღოლის ტელეფონი", notes: "შენიშვნა", call: "ზარი მძღოლს", whatsapp: "WhatsApp",
    edit: "✎ რედაქტირება", delete: "🗑 წაშლა", confirmDelete: "წაშალოთ განცხადება?",
    deleting: "იშლება…", route: "მარშრუტი", driver: "მძღოლი / სერვისი", vehicle: "ტრანსპორტი",
  },
} as const;

function formatDate(ts: string) {
  const d = new Date(ts);
  return isNaN(d.getTime()) ? ts : d.toLocaleString();
}

function waLink(phone: string) {
  const d = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${d.startsWith("995") ? d : `995${d}`}`;
}

function vehicleIcon(type: string) {
  const v = type.toLowerCase();
  if (v.includes("tow") || v.includes("ამწე")) return "🚛";
  if (v.includes("carrier") || v.includes("ავტოვოზი")) return "🚗";
  if (v.includes("trailer") || v.includes("მისაბმელი")) return "🚜";
  if (v.includes("minivan") || v.includes("მინივენი")) return "🚐";
  return "🔧";
}

export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = sp.get("lang") === "en" ? "en" : "ka";
  const t = T[lang];
  const { user, profile } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [id, setId] = useState("");

  useEffect(() => {
    params.then(({ id: pid }) => {
      setId(pid);
      getListingById(pid).then(l => {
        if (!l) setNotFound(true);
        else setListing(l);
      });
    });
  }, [params]);

  function canManage(l: Listing) {
    if (!user) return false;
    return l.user_id === user.id || profile?.role === "admin";
  }

  async function handleDelete() {
    if (!listing || !confirm(t.confirmDelete)) return;
    setDeleting(true);
    try {
      await deleteListing(listing.id);
      router.push(`/?lang=${lang}`);
    } catch (e) { console.error(e); setDeleting(false); }
  }

  if (notFound) return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]">
      <div className="text-lg font-black text-gray-800">{t.notFound}</div>
      <Link href={`/?lang=${lang}`}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
        ← {t.back}
      </Link>
    </main>
  );

  if (!listing) return (
    <main className="flex min-h-[60vh] items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]">
      <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm text-gray-500">
        <svg className="mr-3 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        {lang === "ka" ? "იტვირთება..." : "Loading..."}
      </div>
    </main>
  );

  const owned = canManage(listing);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {/* top bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link href={`/?lang=${lang}`}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50">
            ← {t.back}
          </Link>
          <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">
            {vehicleIcon(listing.vehicle_type)} {listing.vehicle_type}
          </div>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)]">

          {/* hero route header */}
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">{t.route}</div>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl">
              {listing.from_city}
              <span className="mx-3 text-orange-500">→</span>
              {listing.to_city}
            </h1>
            <p className="mt-2 text-sm font-semibold text-gray-500">
              {listing.driver_display_name}
            </p>
          </div>

          <div className="border-t border-gray-100 px-6 pb-8 pt-6 sm:px-8">

            {/* stat cards */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">{t.price}</div>
                <div className="mt-1 text-2xl font-black text-gray-950">{listing.price_gel} ₾</div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">{t.available}</div>
                <div className="mt-1 text-base font-bold text-gray-900">{formatDate(listing.available_from)}</div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">{t.capacity}</div>
                <div className="mt-1 text-2xl font-black text-gray-950">
                  {listing.spots_available}
                  <span className="text-base font-semibold text-gray-400"> / {listing.capacity_total} {t.spots}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">{t.phone}</div>
                <div className="mt-1 text-base font-bold text-gray-900">{listing.driver_phone}</div>
              </div>
            </div>

            {/* notes */}
            {listing.notes && (
              <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4 text-sm font-medium leading-6 text-orange-800">
                💬 {listing.notes}
              </div>
            )}

            {/* CTA buttons */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a href={`tel:${listing.driver_phone}`}
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-orange-500 text-sm font-black text-white transition hover:bg-orange-600">
                📞 {t.call}
              </a>
              <a href={waLink(listing.driver_phone)} target="_blank" rel="noopener noreferrer"
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-sm font-black text-white transition hover:bg-emerald-600">
                💬 {t.whatsapp}
              </a>
            </div>

            {/* owner / admin actions */}
            {owned && (
              <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2">
                <Link href={`/listing/${id}/edit?lang=${lang}`}
                  className="flex h-12 items-center justify-center rounded-2xl border border-gray-300 bg-white text-sm font-bold text-gray-700 transition hover:bg-gray-50">
                  {t.edit}
                </Link>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex h-12 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50">
                  {deleting ? t.deleting : t.delete}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}