"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createListing } from "@/lib/api";
import type { CreateListingInput } from "@/lib/types";

// ── City & vehicle options ───────────────────────────────────────────────────
const CITY_OPTIONS = [
  { en: "Tbilisi",      ka: "თბილისი" },
  { en: "Kutaisi",      ka: "ქუთაისი" },
  { en: "Batumi",       ka: "ბათუმი" },
  { en: "Zugdidi",      ka: "ზუგდიდი" },
  { en: "Gori",         ka: "გორი" },
  { en: "Rustavi",      ka: "რუსთავი" },
  { en: "Telavi",       ka: "თელავი" },
  { en: "Borjomi",      ka: "ბორჯომი" },
  { en: "Bakuriani",    ka: "ბაკურიანი" },
  { en: "Gudauri",      ka: "გუდაური" },
  { en: "Other",        ka: "სხვა" },
];

const VEHICLE_TYPES = [
  { en: "Tow truck",               ka: "ამწე" },
  { en: "Car carrier",             ka: "ავტოვოზი" },
  { en: "Trailer",                 ka: "მისაბმელი" },
  { en: "Minivan (with trailer)",  ka: "მიქსერი (მისაბმელით)" },
  { en: "Other",                   ka: "სხვა" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function normalizePhone(raw: string) {
  return raw.replace(/\s+/g, "").trim();
}

function isValidGePhone(phone: string) {
  const p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("+995")) return /^\+995\d{9}$/.test(p);
  return /^5\d{8}$/.test(p);
}

// ── Component ────────────────────────────────────────────────────────────────
export default function PostListingPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "ka">("ka");
  const ka = lang === "ka";

  const [toCity, setToCity] = useState("Tbilisi");
  const [customCity, setCustomCity] = useState("");
  const [price, setPrice] = useState<number>(400);
  const [capacityTotal, setCapacityTotal] = useState<number>(2);
  const [spotsAvailable, setSpotsAvailable] = useState<number>(1);
  const [availableFrom, setAvailableFrom] = useState<string>(() => {
    const d = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("Tow truck");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const finalToCity = toCity === "Other" ? customCity.trim() : toCity;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (!displayName.trim())
      return setError(ka ? "გთხოვთ შეიყვანოთ სახელი / სერვისის სახელი." : "Please enter your name / service name.");
    if (!finalToCity)
      return setError(ka ? "გთხოვთ აირჩიოთ დანიშნულების ქალაქი." : "Please choose a destination city.");
    if (!Number.isFinite(price) || price < 0)
      return setError(ka ? "ფასი უნდა იყოს 0 ან მეტი." : "Price must be 0 or more.");
    if (!Number.isFinite(capacityTotal) || capacityTotal < 1)
      return setError(ka ? "ტევადობა უნდა იყოს მინიმუმ 1." : "Capacity must be at least 1.");
    if (!Number.isFinite(spotsAvailable) || spotsAvailable < 0)
      return setError(ka ? "ადგილები უნდა იყოს 0 ან მეტი." : "Spots must be 0 or more.");
    if (spotsAvailable > capacityTotal)
      return setError(ka ? "ადგილები ვერ აღემატება ტევადობას." : "Spots available cannot exceed capacity.");

    const p = normalizePhone(phone);
    if (!isValidGePhone(p))
      return setError(ka ? "ტელეფონის ფორმატი: +995555123456 ან 555123456." : "Phone format: +995XXXXXXXXX or 5XXXXXXXX.");

    setLoading(true);
    try {
      const payload: CreateListingInput = {
        from_city: "Poti",
        to_city: finalToCity,
        price_gel: price,
        capacity_total: capacityTotal,
        spots_available: spotsAvailable,
        available_from: new Date(availableFrom).toISOString(),
        driver_display_name: displayName.trim(),
        driver_phone: p,
        vehicle_type: vehicleType,
        notes: notes.trim() || null,
      };
      await createListing(payload);
      setOk(ka ? "✅ განცხადება წარმატებით დაემატა. გადამისამართება…" : "✅ Listing posted successfully. Redirecting…");
      setTimeout(() => { router.push("/"); router.refresh(); }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : null;
      setError(msg ?? (ka ? "შეცდომა." : "Failed to create listing."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      {/* back + lang toggle */}
      <div className="mb-5 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-[var(--copart-blue)] hover:underline">
          ← {ka ? "უკან" : "Back"}
        </Link>
        <button
          onClick={() => setLang(lang === "en" ? "ka" : "en")}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-bold text-gray-700 hover:bg-gray-50"
        >
          {lang === "en" ? "🇬🇪 ქართული" : "🇬🇧 English"}
        </button>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-4xl font-black text-gray-900">
          {ka ? "ტრანსპორტის შეთავაზება პოტიდან" : "Offer transport from Poti"}
        </h1>
        <p className="mt-2 text-gray-600">
          {ka
            ? "მომხმარებლები დაინახავენ თქვენს განცხადებას და პირდაპირ დაგიკავშირდებიან."
            : "Customers will see your offer and call you directly."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          {/* Name */}
          <div>
            <label className="text-sm font-semibold">
              {ka ? "სახელი / სერვისი" : "Name / Service"}
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3"
              placeholder={ka ? "მაგ. გიო ამწის სერვისი" : "e.g., Gio Tow Service"}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-semibold">
              {ka ? "ტელეფონი" : "Phone"}
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3"
              placeholder="+995555123456 or 555123456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="mt-1 text-xs text-gray-500">
              {ka
                ? "ეს ნომერი საჯაროდ გამოჩნდება თქვენს განცხადებაში."
                : "This will be public on your listing."}
            </div>
          </div>

          {/* Vehicle type */}
          <div>
            <label className="text-sm font-semibold">
              {ka ? "სატრანსპორტო საშუალება" : "Vehicle type"}
            </label>
            <select
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            >
              {VEHICLE_TYPES.map((v) => (
                <option key={v.en} value={v.en}>
                  {ka ? v.ka : v.en}
                </option>
              ))}
            </select>
          </div>

          {/* Destination + datetime */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold">
                {ka ? "დანიშნულების ქალაქი" : "Destination city"}
              </label>
              <select
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
              >
                {CITY_OPTIONS.map((c) => (
                  <option key={c.en} value={c.en}>
                    {ka ? c.ka : c.en}
                  </option>
                ))}
              </select>
              {toCity === "Other" && (
                <input
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
                  placeholder={ka ? "ჩაწერეთ ქალაქი" : "Type destination city"}
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                />
              )}
            </div>

            <div>
              <label className="text-sm font-semibold">
                {ka ? "ხელმისაწვდომია" : "Available from"}
              </label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
              />
            </div>
          </div>

          {/* Price / capacity / spots */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-semibold">
                {ka ? "ფასი (₾)" : "Price (GEL)"}
              </label>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min={0}
              />
            </div>
            <div>
              <label className="text-sm font-semibold">
                {ka ? "ტევადობა (მანქ.)" : "Capacity (cars)"}
              </label>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3"
                value={capacityTotal}
                onChange={(e) => setCapacityTotal(Number(e.target.value))}
                min={1}
              />
            </div>
            <div>
              <label className="text-sm font-semibold">
                {ka ? "თავისუფალი ადგილები" : "Spots available"}
              </label>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3"
                value={spotsAvailable}
                onChange={(e) => setSpotsAvailable(Number(e.target.value))}
                min={0}
                max={capacityTotal}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-semibold">
              {ka ? "შენიშვნა (არასავალდებულო)" : "Notes (optional)"}
            </label>
            <textarea
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3"
              rows={4}
              placeholder={ka ? "აღების ადგილი, დრო, სხვა..." : "Pickup location, timing, anything important…"}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          {ok && (
            <div className="rounded-2xl border border-green-300 bg-green-50 p-4 text-sm text-green-700">
              {ok}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[var(--copart-blue)] px-5 py-4 text-base font-bold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading
              ? (ka ? "იგზავნება…" : "Submitting…")
              : (ka ? "განცხადების გამოქვეყნება" : "Submit listing")}
          </button>
        </form>
      </div>
    </main>
  );
}