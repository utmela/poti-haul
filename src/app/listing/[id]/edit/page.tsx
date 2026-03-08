"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getListingById, updateListing } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Listing } from "@/lib/types";

const CITIES = [
  { en: "Tbilisi", ka: "თბილისი" }, { en: "Kutaisi", ka: "ქუთაისი" },
  { en: "Batumi", ka: "ბათუმი" },   { en: "Zugdidi", ka: "ზუგდიდი" },
  { en: "Gori", ka: "გორი" },       { en: "Rustavi", ka: "რუსთავი" },
  { en: "Telavi", ka: "თელავი" },   { en: "Borjomi", ka: "ბორჯომი" },
  { en: "Bakuriani", ka: "ბაკურიანი" }, { en: "Gudauri", ka: "გუდაური" },
  { en: "Poti", ka: "ფოთი" },
  { en: "Other", ka: "სხვა" },
];

const VEHICLES = [
  { en: "Tow truck", ka: "ამწე", icon: "🚛" },
  { en: "Car carrier", ka: "ავტოვოზი", icon: "🚗" },
  { en: "Trailer", ka: "მისაბმელი", icon: "🚜" },
  { en: "Minivan (with trailer)", ka: "მინივენი (მისაბმელით)", icon: "🚐" },
  { en: "Other", ka: "სხვა", icon: "🔧" },
];

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-bold text-gray-800">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = sp.get("lang") === "en" ? "en" : "ka";
  const ka = lang === "ka";
  const { user, profile, loading: authLoading } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const [toCity, setToCity] = useState("Tbilisi");
  const [customCity, setCustomCity] = useState("");
  const [price, setPrice] = useState(0);
  const [capacityTotal, setCapacityTotal] = useState(1);
  const [spotsAvailable, setSpotsAvailable] = useState(0);
  const [availableFrom, setAvailableFrom] = useState("");
  const [vehicleType, setVehicleType] = useState("Tow truck");
  const [notes, setNotes] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => {
      getListingById(id).then(l => {
        if (!l) { setNotFound(true); return; }
        setListing(l);
        const cityMatch = CITIES.find(c => c.en === l.to_city);
        setToCity(cityMatch ? l.to_city : "Other");
        if (!cityMatch) setCustomCity(l.to_city);
        setPrice(l.price_gel);
        setCapacityTotal(l.capacity_total);
        setSpotsAvailable(l.spots_available);
        setAvailableFrom(toDatetimeLocal(l.available_from));
        setVehicleType(l.vehicle_type);
        setNotes(l.notes ?? "");
        setDisplayName(l.driver_display_name);
        setPhone(l.driver_phone);
      });
    });
  }, [params]);

  useEffect(() => {
    if (!authLoading && listing) {
      const canEdit = user && (listing.user_id === user.id || profile?.role === "admin");
      if (!canEdit) setForbidden(true);
    }
  }, [authLoading, listing, user, profile]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!listing) return;
    setError(null);
    const finalCity = toCity === "Other" ? customCity.trim() : toCity;
    if (!finalCity) return setError(ka ? "აირჩიეთ ქალაქი." : "Choose a city.");
    if (spotsAvailable > capacityTotal) return setError(ka ? "ადგილები > ტევადობა." : "Spots exceed capacity.");
    setLoading(true);
    try {
      await updateListing(listing.id, {
        to_city: finalCity, price_gel: price, capacity_total: capacityTotal,
        spots_available: spotsAvailable, available_from: new Date(availableFrom).toISOString(),
        vehicle_type: vehicleType, notes: notes.trim() || null,
        driver_display_name: displayName.trim(), driver_phone: phone.trim(),
      });
      router.push(`/listing/${listing.id}?lang=${lang}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : ka ? "შეცდომა." : "Error.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "h-14 w-full rounded-2xl border border-gray-300 bg-white px-4 text-[15px] font-medium text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

  const textAreaCls =
    "w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[15px] font-medium text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

  if (notFound) return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]">
      <div className="text-lg font-black text-gray-800">{ka ? "განცხადება ვერ მოიძებნა" : "Listing not found"}</div>
      <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
        ← {ka ? "მთავარი" : "Home"}
      </Link>
    </main>
  );

  if (forbidden) return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]">
      <div className="text-lg font-black text-red-600">{ka ? "წვდომა აკრძალულია" : "Access denied"}</div>
      <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
        ← {ka ? "მთავარი" : "Home"}
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
        {ka ? "იტვირთება…" : "Loading…"}
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {/* top bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link href={`/listing/${listing.id}?lang=${lang}`}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50">
            ← {ka ? "უკან" : "Back"}
          </Link>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
          <div className="p-6 sm:p-8">

            <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">
              {ka ? "განცხადების რედაქტირება" : "Edit listing"}
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
              {listing.from_city}
              <span className="mx-3 text-orange-500">→</span>
              {listing.to_city}
            </h1>

            <form onSubmit={onSubmit} className="mt-8 grid gap-5">

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={ka ? "სახელი / სერვისი" : "Name / Service"}>
                  <input className={inputCls} value={displayName} onChange={e => setDisplayName(e.target.value)} />
                </Field>
                <Field label={ka ? "ტელეფონი" : "Phone"}>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-400">📞</span>
                    <input className={`${inputCls} pl-11`} value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </Field>
              </div>

              <Field label={ka ? "დანიშნულება" : "Destination"}>
                <select className={inputCls} value={toCity} onChange={e => setToCity(e.target.value)}>
                  {CITIES.map(c => <option key={c.en} value={c.en}>{ka ? c.ka : c.en}</option>)}
                </select>
                {toCity === "Other" && (
                  <input className={inputCls} placeholder={ka ? "ქალაქის სახელი" : "City name"}
                    value={customCity} onChange={e => setCustomCity(e.target.value)} />
                )}
              </Field>

              <Field label={ka ? "სატრანსპორტო საშუალება" : "Vehicle type"}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {VEHICLES.map(v => {
                    const selected = vehicleType === v.en;
                    return (
                      <button key={v.en} type="button" onClick={() => setVehicleType(v.en)}
                        className={`rounded-2xl border px-4 py-4 text-left transition ${
                          selected
                            ? "border-orange-300 bg-orange-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        }`}>
                        <div className="text-2xl">{v.icon}</div>
                        <div className={`mt-2 text-sm font-bold ${selected ? "text-orange-700" : "text-gray-800"}`}>
                          {ka ? v.ka : v.en}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label={ka ? "ხელმისაწვდომია" : "Available from"}>
                <input type="datetime-local" className={inputCls} value={availableFrom}
                  onChange={e => setAvailableFrom(e.target.value)} />
              </Field>

              <div className="grid grid-cols-3 gap-4">
                <Field label={ka ? "ფასი (₾)" : "Price (₾)"}>
                  <input type="number" min={0} className={inputCls} value={price}
                    onChange={e => setPrice(Number(e.target.value))} />
                </Field>
                <Field label={ka ? "ტევადობა" : "Capacity"}>
                  <input type="number" min={1} className={inputCls} value={capacityTotal}
                    onChange={e => setCapacityTotal(Number(e.target.value))} />
                </Field>
                <Field label={ka ? "ადგილები" : "Spots"}>
                  <input type="number" min={0} max={capacityTotal} className={inputCls} value={spotsAvailable}
                    onChange={e => setSpotsAvailable(Number(e.target.value))} />
                </Field>
              </div>

              <Field
                label={ka ? "შენიშვნა (არასავალდებულო)" : "Notes (optional)"}
                hint={ka ? "მაგ. აღების ადგილი, დამატებითი პირობები." : "e.g. pickup spot, extra conditions."}
              >
                <textarea rows={3} className={textAreaCls} value={notes}
                  onChange={e => setNotes(e.target.value)} />
              </Field>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex gap-3 border-t border-gray-100 pt-2">
                <Link href={`/listing/${listing.id}?lang=${lang}`}
                  className="flex h-14 flex-1 items-center justify-center rounded-2xl border border-gray-300 bg-white text-sm font-bold text-gray-700 transition hover:bg-gray-50">
                  {ka ? "გაუქმება" : "Cancel"}
                </Link>
                <button type="submit" disabled={loading}
                  className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-orange-500 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-50">
                  {loading ? (ka ? "ინახება…" : "Saving…") : (ka ? "✓ შენახვა" : "✓ Save changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}