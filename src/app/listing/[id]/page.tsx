"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import {
  CalendarIcon,
  EditIcon,
  MessageIcon,
  NoteIcon,
  PhoneIcon,
  TrashIcon,
  VehicleGlyph,
} from "@/components/site-icons";
import { deleteListing, getListingById } from "@/lib/api";
import { getAccountRole } from "@/lib/account-role";
import { useAuth } from "@/lib/auth-context";
import {
  cityLabel,
  languageFromSearch,
  type Lang,
  vehicleKind,
  vehicleLabel,
} from "@/lib/site-data";
import type { Listing } from "@/lib/types";

const T = {
  en: {
    notFound: "Listing not found",
    back: "Back",
    price: "Price",
    available: "Available from",
    capacity: "Capacity",
    spots: "spots",
    phone: "Driver phone",
    notes: "Notes",
    call: "Call driver",
    whatsapp: "WhatsApp",
    edit: "Edit listing",
    delete: "Delete listing",
    confirmDelete: "Delete this listing?",
    deleting: "Deleting...",
    route: "Route",
    driver: "Driver / service",
    vehicle: "Vehicle",
  },
  ka: {
    notFound: "განცხადება ვერ მოიძებნა",
    back: "უკან",
    price: "ფასი",
    available: "ხელმისაწვდომია",
    capacity: "ტევადობა",
    spots: "ადგილი",
    phone: "მძღოლის ტელეფონი",
    notes: "შენიშვნა",
    call: "დარეკვა",
    whatsapp: "WhatsApp",
    edit: "რედაქტირება",
    delete: "წაშლა",
    confirmDelete: "წავშალოთ ეს განცხადება?",
    deleting: "იშლება...",
    route: "მარშრუტი",
    driver: "მძღოლი / სერვისი",
    vehicle: "ტრანსპორტი",
  },
} as const;

function formatDate(ts: string, lang: Lang) {
  const date = new Date(ts);
  return Number.isNaN(date.getTime())
    ? ts
    : date.toLocaleString(lang === "ka" ? "ka-GE" : "en-US");
}

function waLink(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits.startsWith("995") ? digits : `995${digits}`}`;
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-base font-bold text-slate-900">{value}</div>
    </div>
  );
}

export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [lang] = useState<Lang>(() =>
    typeof window === "undefined" ? "ka" : languageFromSearch(window.location.search)
  );
  const t = T[lang];
  const { user, profile } = useAuth();
  const accountRole = getAccountRole(user, profile);

  const [listing, setListing] = useState<Listing | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [id, setId] = useState("");

  useEffect(() => {
    params.then(({ id: listingId }) => {
      setId(listingId);
      getListingById(listingId).then((data) => {
        if (!data) setNotFound(true);
        else setListing(data);
      });
    });
  }, [params]);

  function canManage(currentListing: Listing) {
    if (!user) return false;
    return currentListing.user_id === user.id || accountRole === "admin";
  }

  async function handleDelete() {
    if (!listing || !confirm(t.confirmDelete)) return;

    setDeleting(true);

    try {
      await deleteListing(listing.id);
      router.push(`/?lang=${lang}`);
    } catch (error) {
      console.error(error);
      setDeleting(false);
    }
  }

  if (notFound) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="text-lg font-black text-slate-800">{t.notFound}</div>
        <Link
          href={`/?lang=${lang}`}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          ← {t.back}
        </Link>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center rounded-[24px] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur text-slate-500">
          <svg className="mr-3 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8Z" />
          </svg>
          {lang === "ka" ? "იტვირთება..." : "Loading..."}
        </div>
      </main>
    );
  }

  const owned = canManage(listing);
  const kind = vehicleKind(listing.vehicle_type);
  const displayFromCity = cityLabel(listing.from_city, lang);
  const displayToCity = cityLabel(listing.to_city, lang);
  const displayVehicle = vehicleLabel(listing.vehicle_type, lang);

  return (
    <main lang={lang} className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href={`/?lang=${lang}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            ← {t.back}
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">
            <VehicleGlyph kind={kind} className="h-4 w-4" />
            {displayVehicle}
          </div>
        </div>

        <div className="overflow-hidden rounded-[36px] border border-white/80 bg-white/84 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.2),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.18),transparent_34%),linear-gradient(155deg,#f8fcff_0%,#eef8ff_58%,#fff8ef_100%)] p-6 text-slate-900 sm:p-8">
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-700">
                    {t.route}
                  </div>
                  <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
                    {displayFromCity}
                    <span className="mx-3 text-orange-400">→</span>
                    {displayToCity}
                  </h1>
                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    {listing.driver_display_name}
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-4 rounded-[28px] border border-sky-100 bg-white/85 px-5 py-5 shadow-[0_18px_45px_rgba(2,74,122,0.08)] backdrop-blur">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-sky-600 to-blue-700 text-white">
                    <VehicleGlyph kind={kind} className="h-10 w-10" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {t.vehicle}
                    </div>
                    <div className="mt-1 text-lg font-bold text-slate-900">{displayVehicle}</div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  <a
                    href={`tel:${listing.driver_phone}`}
                    className="flex h-14 items-center justify-center gap-2 rounded-[24px] bg-gradient-to-r from-sky-600 to-blue-700 text-sm font-black text-white shadow-[0_14px_34px_rgba(2,132,199,0.22)] transition hover:from-sky-500 hover:to-blue-600"
                  >
                    <PhoneIcon className="h-4 w-4" />
                    {t.call}
                  </a>
                  <a
                    href={waLink(listing.driver_phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-14 items-center justify-center gap-2 rounded-[24px] bg-[#25d366] text-sm font-black text-white transition hover:brightness-95"
                  >
                    <MessageIcon className="h-4 w-4" />
                    {t.whatsapp}
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid gap-3 sm:grid-cols-2">
                <StatCard
                  label={t.price}
                  value={
                    <span className="text-2xl font-black text-slate-950">
                      {listing.price_gel}
                      <span className="ml-1 text-orange-500">₾</span>
                    </span>
                  }
                />
                <StatCard label={t.available} value={formatDate(listing.available_from, lang)} />
                <StatCard
                  label={t.capacity}
                  value={
                    <span className="text-2xl font-black text-slate-950">
                      {listing.spots_available}
                      <span className="text-base font-semibold text-slate-400">
                        {" "}
                        / {listing.capacity_total} {t.spots}
                      </span>
                    </span>
                  }
                />
                <StatCard label={t.phone} value={listing.driver_phone} />
              </div>

              <div className="mt-5 grid gap-4 rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500">
                    <PhoneIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      {t.driver}
                    </div>
                    <div className="mt-1 text-base font-bold text-slate-900">
                      {listing.driver_display_name}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      {t.available}
                    </div>
                    <div className="mt-1 text-base font-bold text-slate-900">
                      {formatDate(listing.available_from, lang)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500">
                    <VehicleGlyph kind={kind} className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      {t.vehicle}
                    </div>
                    <div className="mt-1 text-base font-bold text-slate-900">
                      {displayVehicle}
                    </div>
                  </div>
                </div>
              </div>

              {listing.notes && (
                <div className="mt-5 rounded-[28px] border border-orange-100 bg-orange-50 px-5 py-4 text-sm leading-6 text-slate-700">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-700">
                    <NoteIcon className="h-4 w-4" />
                    {t.notes}
                  </div>
                  {listing.notes}
                </div>
              )}

              {owned && (
                <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
                  <Link
                    href={`/listing/${id}/edit?lang=${lang}`}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[22px] border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <EditIcon className="h-4 w-4" />
                    {t.edit}
                  </Link>
                  <button
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[22px] border border-red-200 bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                    {deleting ? t.deleting : t.delete}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
