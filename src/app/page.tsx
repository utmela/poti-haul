"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getListings } from "@/lib/api";
import type { Listing } from "@/lib/types";

function formatDate(ts: string) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

function getAvailabilityBadge(ts: string) {
  const now = new Date();
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "Scheduled";

  const diffMs = date.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours <= 0) return "Available now";
  if (diffHours < 24) return "Today";
  if (diffHours < 48) return "Tomorrow";
  return "Upcoming";
}

export default function Home() {
  const [destination, setDestination] = useState("");
  const [minGel, setMinGel] = useState("");
  const [maxGel, setMaxGel] = useState("");
  const [onlyWithSpots, setOnlyWithSpots] = useState(false);

  const [loading, setLoading] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);

  const parsedMin = useMemo(() => {
    const n = Number(minGel);
    return minGel.trim() === "" ? undefined : Number.isFinite(n) ? n : undefined;
  }, [minGel]);

  const parsedMax = useMemo(() => {
    const n = Number(maxGel);
    return maxGel.trim() === "" ? undefined : Number.isFinite(n) ? n : undefined;
  }, [maxGel]);

  const totalSpots = listings.reduce((sum, l) => sum + l.spots_available, 0);
  const coveredCities = new Set(listings.map((l) => l.to_city)).size;

  async function load() {
    setLoading(true);
    const data = await getListings({
      destination,
      minGel: parsedMin,
      maxGel: parsedMax,
      onlyWithSpots,
    });
    setListings(data);
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
      setTimeout(() => setCopiedPhone(null), 1200);
    } catch {}
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <div className="bg-[var(--copart-blue)] text-white shadow-sm">
  <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
    
    <div className="text-lg font-black">
      Poti Transport
    </div>

    <Link
      href="/post"
      className="rounded-lg bg-[var(--copart-yellow)] px-4 py-2 text-sm font-bold text-black hover:brightness-95"
    >
      Post transport
    </Link>

  </div>
</div>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <header className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Georgia car transport
              </div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900 md:text-5xl">
                Poti → Car Transport
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-gray-600 md:text-base">
                Find tow truck and car carrier offers from Poti to Georgian cities.
                Compare prices, available spots, and call drivers directly.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/post"
                className="inline-flex items-center rounded-xl bg-[var(--copart-blue)] px-4 py-2 font-bold text-white shadow-sm hover:opacity-90"
              >
                + Post a listing
              </Link>

              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Active listings
              </div>
              <div className="mt-1 text-2xl font-black text-gray-900">{listings.length}</div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Cities covered
              </div>
              <div className="mt-1 text-2xl font-black text-gray-900">{coveredCities}</div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Available spots
              </div>
              <div className="mt-1 text-2xl font-black text-gray-900">{totalSpots}</div>
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
          <form
            className="grid gap-3 md:grid-cols-[1.4fr_0.7fr_0.7fr_auto_auto_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              load();
            }}
          >
            <input
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-500"
              placeholder="Destination city (e.g., Tbilisi)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />

            <input
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-500"
              placeholder="Min GEL"
              value={minGel}
              onChange={(e) => setMinGel(e.target.value)}
              inputMode="numeric"
            />

            <input
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-500"
              placeholder="Max GEL"
              value={maxGel}
              onChange={(e) => setMaxGel(e.target.value)}
              inputMode="numeric"
            />

            <label className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={onlyWithSpots}
                onChange={(e) => setOnlyWithSpots(e.target.checked)}
              />
              Only with spots
            </label>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[var(--copart-blue)] px-5 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
            >
              Search
            </button>

            <button
              type="button"
              onClick={() => {
                resetFilters();
                setTimeout(load, 0);
              }}
             className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50"
            >
              Reset
            </button>
          </form>
        </section>

        <section className="mt-6 grid gap-4">
          {loading ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-8 text-sm text-gray-600 shadow-sm">
              Loading listings...
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center shadow-sm">
              <div className="text-lg font-bold text-gray-900">No listings found</div>
              <div className="mt-2 text-sm text-gray-600">
                Try changing filters or post a new transport offer.
              </div>
              <div className="mt-5">
                <Link
                  href="/post"
                  className="inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white hover:bg-gray-800"
                >
                  Post a listing
                </Link>
              </div>
            </div>
          ) : (
            listings.map((l) => {
              const badge = getAvailabilityBadge(l.available_from);
              const phoneHref = `tel:${l.driver_phone}`;
              const copied = copiedPhone === l.driver_phone;

              return (
                <div
                  key={l.id}
                  className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-black text-gray-900">
                          {l.from_city} → {l.to_city}
                        </h2>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                          {badge}
                        </span>

                        {l.spots_available > 0 ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                            {l.spots_available} spot{l.spots_available !== 1 ? "s" : ""} left
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                            Full
                          </span>
                        )}
                      </div>

                      <div className="mt-2 text-sm text-gray-600">
                        {l.driver_display_name} · {l.vehicle_type}
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-gray-700 md:grid-cols-2">
                        <div>
                          Spots: <b>{l.spots_available}</b> / {l.capacity_total}
                        </div>
                        <div>
                          Available: <b>{formatDate(l.available_from)}</b>
                        </div>
                      </div>

                      {l.notes ? (
                        <div className="mt-3 rounded-2xl bg-gray-50 p-3 text-sm text-gray-700">
                          <span className="font-semibold text-gray-900">Notes:</span> {l.notes}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[220px]">
                      <div className="rounded-2xl bg-[var(--copart-blue)] px-4 py-3 text-center text-white shadow-md">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-300">
                          Price
                        </div>
                        <div className="mt-1 text-3xl font-black">{l.price_gel} GEL</div>
                      </div>

                      <a
                        href={phoneHref}
                        className="rounded-xl bg-[var(--copart-yellow)] px-4 py-3 text-center text-sm font-bold text-black shadow-sm hover:brightness-95"
                      >
                        Call driver
                      </a>

                      <button
                        type="button"
                        onClick={() => copyPhone(l.driver_phone)}
                        className="rounded-xl border border-[var(--copart-blue)] bg-white px-4 py-3 text-sm font-bold text-[var(--copart-blue)] hover:bg-blue-50"
                      >
                        {copied ? "Phone copied" : "Copy phone"}
                      </button>

                      <Link
                        href={`/listing/${l.id}`}
                        className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-bold text-gray-800 hover:bg-gray-50"
                      >
                        View details
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