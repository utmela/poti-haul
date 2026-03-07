import Link from "next/link";
import { getListingById } from "@/lib/api";

const T = {
  en: {
    notFound: "Listing not found",
    back: "← Back",
    price: "Price",
    available: "Available from",
    capacity: "Capacity",
    spots: "spots",
    phone: "Driver phone",
    notes: "Notes",
    call: "📞 Call driver",
    whatsapp: "💬 WhatsApp",
  },
  ka: {
    notFound: "განცხადება ვერ მოიძებნა",
    back: "← უკან",
    price: "ფასი",
    available: "ხელმისაწვდომია",
    capacity: "ტევადობა",
    spots: "ადგილი",
    phone: "მძღოლის ტელეფონი",
    notes: "შენიშვნა",
    call: "📞 ზარი მძღოლს",
    whatsapp: "💬 WhatsApp",
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

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { id } = await params;
  const { lang: langParam } = await searchParams;
  const lang = langParam === "en" ? "en" : "ka";
  const t = T[lang];

  const listing = await getListingById(id);

  if (!listing) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-2xl font-black text-gray-900">{t.notFound}</div>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-[var(--copart-blue)] hover:underline">
            {t.back}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(160deg,#f0f4ff 0%,#f7f8fa 60%,#fff 100%)" }}>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href={`/?lang=${lang}`} className="text-sm font-semibold text-[var(--copart-blue)] hover:underline">
          {t.back}
        </Link>

        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* header strip */}
          <div className="bg-[var(--copart-blue)] px-6 py-5">
            <h1 className="text-3xl font-black text-white md:text-4xl">
              {listing.from_city} <span className="text-yellow-300">→</span> {listing.to_city}
            </h1>
            <p className="mt-1 text-sm text-blue-200">
              {listing.driver_display_name} · {listing.vehicle_type}
            </p>
          </div>

          <div className="p-6">
            {/* stat grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t.price}</div>
                <div className="mt-1 text-2xl font-black text-gray-900">{listing.price_gel} ₾</div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t.available}</div>
                <div className="mt-1 text-lg font-bold text-gray-900">{formatDate(listing.available_from)}</div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t.capacity}</div>
                <div className="mt-1 text-lg font-bold text-gray-900">
                  {listing.spots_available} / {listing.capacity_total} {t.spots}
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t.phone}</div>
                <div className="mt-1 text-lg font-bold text-gray-900">{listing.driver_phone}</div>
              </div>
            </div>

            {listing.notes && (
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                💬 {listing.notes}
              </div>
            )}

            {/* CTA buttons */}
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
          </div>
        </div>
      </div>
    </main>
  );
}