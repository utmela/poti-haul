import Link from "next/link";
import { getListingById } from "@/lib/api";

function formatDate(ts: string) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-2xl font-black text-gray-900">Listing not found</div>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-gray-700 underline">
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-5">
        <Link href="/" className="text-sm font-semibold text-gray-700 hover:underline">
          ← Back to home
        </Link>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-black text-gray-900">
              {listing.from_city} → {listing.to_city}
            </h1>

            <div className="mt-3 text-lg text-gray-700">
              {listing.driver_display_name} · {listing.vehicle_type}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Price
                </div>
                <div className="mt-1 text-2xl font-black text-gray-900">
                  {listing.price_gel} GEL
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Available from
                </div>
                <div className="mt-1 text-lg font-bold text-gray-900">
                  {formatDate(listing.available_from)}
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Capacity
                </div>
                <div className="mt-1 text-lg font-bold text-gray-900">
                  {listing.spots_available} / {listing.capacity_total} spots
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Driver phone
                </div>
                <div className="mt-1 text-lg font-bold text-gray-900">
                  {listing.driver_phone}
                </div>
              </div>
            </div>

            {listing.notes ? (
              <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-gray-700">
                <div className="mb-1 text-sm font-semibold text-gray-900">Notes</div>
                {listing.notes}
              </div>
            ) : null}
          </div>

          <div className="w-full lg:w-[240px]">
            <a
              href={`tel:${listing.driver_phone}`}
              className="block rounded-2xl bg-green-600 px-5 py-4 text-center text-base font-bold text-white transition hover:bg-green-700"
            >
              Call driver
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}