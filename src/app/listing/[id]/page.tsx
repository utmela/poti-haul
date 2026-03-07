"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getListingById, deleteListing } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Listing } from "@/lib/types";

const T = {
  en: {
    notFound: "Listing not found", back: "← Back", price: "Price",
    available: "Available from", capacity: "Capacity", spots: "spots",
    phone: "Driver phone", notes: "Notes", call: "📞 Call driver", whatsapp: "💬 WhatsApp",
    edit: "✎ Edit listing", delete: "🗑 Delete listing", confirmDelete: "Delete this listing?",
    deleting: "Deleting…",
  },
  ka: {
    notFound: "განცხადება ვერ მოიძებნა", back: "← უკან", price: "ფასი",
    available: "ხელმისაწვდომია", capacity: "ტევადობა", spots: "ადგილი",
    phone: "მძღოლის ტელეფონი", notes: "შენიშვნა", call: "📞 ზარი მძღოლს", whatsapp: "💬 WhatsApp",
    edit: "✎ რედაქტირება", delete: "🗑 წაშლა", confirmDelete: "წაშალოთ განცხადება?",
    deleting: "იშლება…",
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
    <main className="p-8 text-center">
      <div className="text-lg font-bold">{t.notFound}</div>
      <Link href={`/?lang=${lang}`} className="mt-3 inline-block text-sm text-[var(--copart-blue)] hover:underline">{t.back}</Link>
    </main>
  );

  if (!listing) return (
    <main className="flex min-h-[60vh] items-center justify-center text-gray-400">
      <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </main>
  );

  const owned = canManage(listing);

  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(160deg,#f0f4ff 0%,#f7f8fa 60%,#fff 100%)" }}>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href={`/?lang=${lang}`} className="text-sm font-semibold text-[var(--copart-blue)] hover:underline">
          {t.back}
        </Link>

        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* header */}
          <div className="bg-[var(--copart-blue)] px-6 py-5">
            <h1 className="text-3xl font-black text-white md:text-4xl">
              {listing.from_city} <span className="text-yellow-300">→</span> {listing.to_city}
            </h1>
            <p className="mt-1 text-sm text-blue-200">{listing.driver_display_name} · {listing.vehicle_type}</p>
          </div>

          <div className="p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: t.price, value: `${listing.price_gel} ₾` },
                { label: t.available, value: formatDate(listing.available_from) },
                { label: t.capacity, value: `${listing.spots_available} / ${listing.capacity_total} ${t.spots}` },
                { label: t.phone, value: listing.driver_phone },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</div>
                  <div className="mt-1 text-lg font-bold text-gray-900">{value}</div>
                </div>
              ))}
            </div>

            {listing.notes && (
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                💬 {listing.notes}
              </div>
            )}

            {/* CTA */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a href={`tel:${listing.driver_phone}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-[var(--copart-yellow)] px-5 py-3 text-sm font-black text-black hover:brightness-95 transition">
                {t.call}
              </a>
              <a href={waLink(listing.driver_phone)} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#25d366] px-5 py-3 text-sm font-black text-white hover:bg-[#1ebe5d] transition">
                {t.whatsapp}
              </a>
            </div>

            {/* owner actions */}
            {owned && (
              <div className="mt-4 flex gap-3 border-t border-gray-100 pt-4">
                <Link href={`/listing/${id}/edit?lang=${lang}`}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
                  {t.edit}
                </Link>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50 transition">
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