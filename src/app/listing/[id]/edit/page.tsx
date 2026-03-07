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
  { en: "Other", ka: "სხვა" },
];
const VEHICLES = ["Tow truck", "Car carrier", "Trailer", "Minivan (with trailer)", "Other"];

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

  const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[var(--copart-blue)] focus:bg-white transition";

  if (notFound) return (
    <main className="p-8 text-center">
      <div className="text-lg font-bold">{ka ? "განცხადება ვერ მოიძებნა" : "Listing not found"}</div>
      <Link href="/" className="mt-3 inline-block text-sm text-[var(--copart-blue)] hover:underline">← {ka ? "მთავარი" : "Home"}</Link>
    </main>
  );

  if (forbidden) return (
    <main className="p-8 text-center">
      <div className="text-lg font-bold text-red-600">{ka ? "წვდომა აკრძალულია" : "Access denied"}</div>
      <Link href="/" className="mt-3 inline-block text-sm text-[var(--copart-blue)] hover:underline">← {ka ? "მთავარი" : "Home"}</Link>
    </main>
  );

  if (!listing) return (
    <main className="flex min-h-[60vh] items-center justify-center text-gray-400">
      <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      {ka ? "იტვირთება…" : "Loading…"}
    </main>
  );

  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(160deg,#f0f4ff 0%,#f7f8fa 60%,#fff 100%)" }}>
      <div className="mx-auto max-w-xl px-4 py-8">
        <div className="mb-5 flex items-center justify-between">
          <Link href={`/listing/${listing.id}?lang=${lang}`} className="text-sm font-semibold text-[var(--copart-blue)] hover:underline">
            ← {ka ? "უკან" : "Back"}
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <h1 className="text-2xl font-black text-gray-900 mb-6">
            {ka ? "განცხადების რედაქტირება" : "Edit listing"}
          </h1>

          <form onSubmit={onSubmit} className="grid gap-5">
            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-gray-700">{ka ? "სახელი / სერვისი" : "Name / Service"}</label>
              <input className={inputCls} value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-gray-700">{ka ? "ტელეფონი" : "Phone"}</label>
              <input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-gray-700">{ka ? "დანიშნულება" : "Destination"}</label>
              <select className={inputCls + " cursor-pointer"} value={toCity} onChange={e => setToCity(e.target.value)}>
                {CITIES.map(c => <option key={c.en} value={c.en}>{ka ? c.ka : c.en}</option>)}
              </select>
              {toCity === "Other" && (
                <input className={inputCls + " mt-2"} placeholder={ka ? "ქალაქის სახელი" : "City name"}
                  value={customCity} onChange={e => setCustomCity(e.target.value)} />
              )}
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-gray-700">{ka ? "სატრანსპორტო საშუალება" : "Vehicle"}</label>
              <select className={inputCls + " cursor-pointer"} value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
                {VEHICLES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-gray-700">{ka ? "ხელმისაწვდომია" : "Available from"}</label>
              <input type="datetime-local" className={inputCls} value={availableFrom} onChange={e => setAvailableFrom(e.target.value)} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-gray-700">{ka ? "ფასი (₾)" : "Price (₾)"}</label>
                <input type="number" className={inputCls} value={price} min={0} onChange={e => setPrice(Number(e.target.value))} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-gray-700">{ka ? "ტევადობა" : "Capacity"}</label>
                <input type="number" className={inputCls} value={capacityTotal} min={1} onChange={e => setCapacityTotal(Number(e.target.value))} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-bold text-gray-700">{ka ? "ადგილები" : "Spots"}</label>
                <input type="number" className={inputCls} value={spotsAvailable} min={0} max={capacityTotal} onChange={e => setSpotsAvailable(Number(e.target.value))} />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-bold text-gray-700">{ka ? "შენიშვნა" : "Notes"}</label>
              <textarea className={inputCls} rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">⚠️ {error}</div>
            )}

            <div className="flex gap-3">
              <Link href={`/listing/${listing.id}?lang=${lang}`}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-center text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
                {ka ? "გაუქმება" : "Cancel"}
              </Link>
              <button type="submit" disabled={loading}
                className="flex-1 rounded-xl bg-[var(--copart-blue)] py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition">
                {loading ? (ka ? "ინახება…" : "Saving…") : (ka ? "✓ შენახვა" : "✓ Save changes")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}