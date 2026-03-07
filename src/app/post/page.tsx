"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createListing } from "@/lib/api";
import type { CreateListingInput } from "@/lib/types";

const CITY_OPTIONS = [
  "Tbilisi",
  "Kutaisi",
  "Batumi",
  "Zugdidi",
  "Gori",
  "Rustavi",
  "Telavi",
  "Borjomi",
  "Bakuriani",
  "Gudauri",
  "Other",
];

const VEHICLE_TYPES = [
  "Tow truck",
  "Car carrier",
  "Trailer",
  "Minivan (with trailer)",
  "Other",
];

function normalizePhone(raw: string) {
  return raw.replace(/\s+/g, "").trim();
}

function isValidGePhone(phone: string) {
  const p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("+995")) return /^\+995\d{9}$/.test(p);
  return /^5\d{8}$/.test(p);
}

export default function PostListingPage() {
  const router = useRouter();

  const [toCity, setToCity] = useState("Tbilisi");
  const [customCity, setCustomCity] = useState("");
  const [price, setPrice] = useState<number>(400);
  const [capacityTotal, setCapacityTotal] = useState<number>(2);
  const [spotsAvailable, setSpotsAvailable] = useState<number>(1);
  const [availableFrom, setAvailableFrom] = useState<string>(() => {
    const d = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
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

    if (!displayName.trim()) return setError("Please enter your name / service name.");
    if (!finalToCity) return setError("Please choose a destination city.");
    if (!Number.isFinite(price) || price < 0) return setError("Price must be 0 or more.");
    if (!Number.isFinite(capacityTotal) || capacityTotal < 1)
      return setError("Capacity must be at least 1.");
    if (!Number.isFinite(spotsAvailable) || spotsAvailable < 0)
      return setError("Spots must be 0 or more.");
    if (spotsAvailable > capacityTotal)
      return setError("Spots available cannot be greater than capacity.");

    const p = normalizePhone(phone);
    if (!isValidGePhone(p)) return setError("Phone format: +995XXXXXXXXX or 5XXXXXXXX.");

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
        notes: notes.trim() ? notes.trim() : null,
      };

      await createListing(payload);
      setOk("✅ Listing posted successfully. Redirecting...");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 700);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create listing.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-5 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-[var(--copart-blue)] hover:underline">
          ← Back
        </Link>
        <div className="text-sm font-semibold text-gray-500">Post a listing</div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-4xl font-black text-gray-900">Offer transport from Poti</h1>
        <p className="mt-2 text-gray-600">
          Customers will see your offer and call you directly.
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <div>
            <label className="text-sm font-semibold">Name / Service</label>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3"
              placeholder="e.g., Gio Tow Service"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Phone</label>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3"
              placeholder="+995555123456 or 555123456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="mt-1 text-xs text-gray-500">This will be public on your listing.</div>
          </div>

          <div>
            <label className="text-sm font-semibold">Vehicle type</label>
            <select
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            >
              {VEHICLE_TYPES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold">Destination city</label>
              <select
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
              >
                {CITY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {toCity === "Other" && (
                <input
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
                  placeholder="Type destination city"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                />
              )}
            </div>

            <div>
              <label className="text-sm font-semibold">Available from</label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-semibold">Price (GEL)</label>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min={0}
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Capacity (cars)</label>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3"
                value={capacityTotal}
                onChange={(e) => setCapacityTotal(Number(e.target.value))}
                min={1}
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Spots available</label>
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

          <div>
            <label className="text-sm font-semibold">Notes (optional)</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3"
              rows={4}
              placeholder="Pickup location, timing, anything important..."
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
            {loading ? "Submitting..." : "Submit listing"}
          </button>
        </form>
      </div>
    </main>
  );
}