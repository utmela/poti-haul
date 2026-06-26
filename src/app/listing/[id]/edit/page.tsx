"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { StylizedDropdown } from "@/components/stylized-dropdown";
import {
  CalendarIcon,
  CapacityIcon,
  CheckIcon,
  MapPinIcon,
  NoteIcon,
  PhoneIcon,
  VehicleGlyph,
} from "@/components/site-icons";
import { getListingById, updateListing } from "@/lib/api";
import { getAccountRole } from "@/lib/account-role";
import { useAuth } from "@/lib/auth-context";
import {
  clampIntegerInput,
  MAX_CAPACITY,
  MAX_PRICE_GEL,
} from "@/lib/number-input";
import {
  cityLabel,
  CITY_OPTIONS,
  languageFromSearch,
  type Lang,
  VEHICLE_OPTIONS,
  vehicleKind,
  vehicleLabel,
} from "@/lib/site-data";
import type { Listing } from "@/lib/types";

function toDatetimeLocal(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function normalizePhone(raw: string) {
  return raw.replace(/\s+/g, "").trim();
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-bold text-slate-800">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [lang] = useState<Lang>(() =>
    typeof window === "undefined" ? "ka" : languageFromSearch(window.location.search)
  );
  const ka = lang === "ka";
  const { user, profile, loading: authLoading } = useAuth();
  const accountRole = getAccountRole(user, profile);

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
      getListingById(id).then((data) => {
        if (!data) {
          setNotFound(true);
          return;
        }

        setListing(data);
        const cityMatch = CITY_OPTIONS.find((city) => city.value === data.to_city);
        setToCity(cityMatch ? data.to_city : "Other");
        if (!cityMatch) setCustomCity(data.to_city);
        setPrice(data.price_gel);
        setCapacityTotal(data.capacity_total);
        setSpotsAvailable(data.spots_available);
        setAvailableFrom(toDatetimeLocal(data.available_from));
        setVehicleType(data.vehicle_type);
        setNotes(data.notes ?? "");
        setDisplayName(data.driver_display_name);
        setPhone(data.driver_phone);
      });
    });
  }, [params]);

  useEffect(() => {
    if (!authLoading && listing) {
      const canEdit =
        user && (listing.user_id === user.id || accountRole === "admin");
      if (!canEdit) {
        setForbidden(true);
      }
    }
  }, [accountRole, authLoading, listing, user]);

  const cityOptions = useMemo(
    () =>
      CITY_OPTIONS.map((city) => ({
        value: city.value,
        label: lang === "ka" ? city.ka : city.en,
        icon: <MapPinIcon className="h-4 w-4" />,
      })),
    [lang]
  );

  const inputCls =
    "h-[58px] w-full rounded-[25px] border border-slate-200 bg-white px-4 text-[15px] font-semibold text-slate-900 placeholder:text-slate-400 shadow-[0_10px_24px_rgba(15,23,42,0.04)] outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100";
  const textAreaCls =
    "w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-[15px] font-semibold text-slate-900 placeholder:text-slate-400 shadow-[0_10px_24px_rgba(15,23,42,0.04)] outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100";

  function updateCapacityTotal(raw: string) {
    const nextCapacity = clampIntegerInput(raw, 1, MAX_CAPACITY, capacityTotal);
    setCapacityTotal(nextCapacity);
    setSpotsAvailable((current) => Math.min(current, nextCapacity));
  }

  function updateSpotsAvailable(raw: string) {
    setSpotsAvailable(
      clampIntegerInput(raw, 0, Math.min(capacityTotal, MAX_CAPACITY), spotsAvailable)
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!listing) return;

    setError(null);
    const finalCity = toCity === "Other" ? customCity.trim() : toCity;

    if (!finalCity) {
      setError(ka ? "აირჩიე ქალაქი." : "Choose a city.");
      return;
    }

    if (spotsAvailable > capacityTotal) {
      setError(ka ? "ადგილები ტევადობაზე მეტია." : "Spots exceed capacity.");
      return;
    }

    setLoading(true);

    try {
      await updateListing(listing.id, {
        to_city: finalCity,
        price_gel: price,
        capacity_total: capacityTotal,
        spots_available: spotsAvailable,
        available_from: new Date(availableFrom).toISOString(),
        vehicle_type: vehicleType,
        notes: notes.trim() || null,
        driver_display_name: displayName.trim(),
        driver_phone: normalizePhone(phone),
      });
      router.push(`/listing/${listing.id}?lang=${lang}`);
      router.refresh();
    } catch (unknownError: unknown) {
      setError(unknownError instanceof Error ? unknownError.message : ka ? "შეცდომა." : "Error.");
    } finally {
      setLoading(false);
    }
  }

  if (notFound) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="text-lg font-black text-slate-800">
          {ka ? "განცხადება ვერ მოიძებნა" : "Listing not found"}
        </div>
        <Link
          href={`/?lang=${lang}`}
          className="inline-flex min-h-12 items-center gap-2 rounded-[22px] border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          ← {ka ? "მთავარი" : "Home"}
        </Link>
      </main>
    );
  }

  if (forbidden) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="text-lg font-black text-red-600">
          {ka ? "წვდომა აკრძალულია" : "Access denied"}
        </div>
        <Link
          href={`/?lang=${lang}`}
          className="inline-flex min-h-12 items-center gap-2 rounded-[22px] border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          ← {ka ? "მთავარი" : "Home"}
        </Link>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center rounded-[24px] border border-white/70 bg-white/80 px-5 py-4 text-slate-500 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
          <svg className="mr-3 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8Z" />
          </svg>
          {ka ? "იტვირთება..." : "Loading..."}
        </div>
      </main>
    );
  }

  const finalCity = toCity === "Other" ? customCity.trim() : toCity;
  const displayVehicle = vehicleLabel(vehicleType, lang);
  const displayToCity = cityLabel(finalCity || listing.to_city, lang);
  const displayFromCity = cityLabel(listing.from_city, lang);

  return (
    <main lang={lang} className="min-h-screen">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href={`/listing/${listing.id}?lang=${lang}`}
            className="inline-flex min-h-12 items-center gap-2 rounded-[22px] border border-slate-200 bg-white/85 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            ← {ka ? "უკან" : "Back"}
          </Link>
        </div>

        <div className="overflow-hidden rounded-[36px] border border-white/80 bg-white/84 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-8">
              <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">
                {ka ? "განცხადების რედაქტირება" : "Edit listing"}
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {displayFromCity}
                <span className="mx-3 text-orange-500">→</span>
                {displayToCity}
              </h1>

              <form onSubmit={onSubmit} className="mt-8 grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={ka ? "სახელი / სერვისი" : "Name / service"}>
                    <input
                      className={inputCls}
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                    />
                  </Field>

                  <Field label={ka ? "ტელეფონი" : "Phone"}>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <PhoneIcon className="h-5 w-5" />
                      </span>
                      <input
                        className={`${inputCls} pl-12`}
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                      />
                    </div>
                  </Field>
                </div>

                <Field
                  label={ka ? "მიმართულება" : "Destination"}
                  hint={ka ? "გამგზავრების ქალაქი ფიქსირებულია ფოთიდან არსებულ მარშრუტზე." : "The departure city stays on the original route."}
                >
                  <StylizedDropdown
                    value={toCity}
                    onChange={setToCity}
                    options={cityOptions}
                    placeholder={ka ? "აირჩიე ქალაქი" : "Choose city"}
                    buttonIcon={<MapPinIcon className="h-4 w-4" />}
                  />
                  {toCity === "Other" && (
                    <input
                      className={inputCls}
                      placeholder={ka ? "ქალაქის სახელი" : "City name"}
                      value={customCity}
                      onChange={(event) => setCustomCity(event.target.value)}
                    />
                  )}
                </Field>

                <Field label={ka ? "ტრანსპორტის ტიპი" : "Vehicle type"}>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {VEHICLE_OPTIONS.map((vehicle) => {
                      const selected = vehicleType === vehicle.value;
                      const kind = vehicle.kind ?? "other";

                      return (
                        <button
                          key={vehicle.value}
                          type="button"
                          onClick={() => setVehicleType(vehicle.value)}
                          className={`rounded-[26px] border px-4 py-4 text-left transition ${
                            selected
                              ? "border-sky-400 bg-sky-50 text-sky-900 shadow-[0_18px_40px_rgba(2,132,199,0.13)] ring-4 ring-sky-100"
                              : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/50"
                          }`}
                        >
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                              selected ? "bg-gradient-to-br from-sky-600 to-blue-700 text-white" : "bg-sky-50 text-sky-700"
                            }`}
                          >
                            <VehicleGlyph kind={kind} className="h-6 w-6" />
                          </div>
                          <div className={`mt-3 text-sm font-bold ${selected ? "text-sky-900" : "text-slate-800"}`}>
                            {lang === "ka" ? vehicle.ka : vehicle.en}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label={ka ? "ხელმისაწვდომია" : "Available from"}>
                  <input
                    type="datetime-local"
                    className={inputCls}
                    value={availableFrom}
                    onChange={(event) => setAvailableFrom(event.target.value)}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label={ka ? "ფასი (₾)" : "Price (₾)"}>
                    <input
                      type="text"
                      inputMode="numeric"
                      min={0}
                      max={MAX_PRICE_GEL}
                      maxLength={5}
                      className={inputCls}
                      value={price}
                      onChange={(event) =>
                        setPrice(
                          clampIntegerInput(event.target.value, 0, MAX_PRICE_GEL, price)
                        )
                      }
                    />
                  </Field>
                  <Field label={ka ? "ტევადობა" : "Capacity"}>
                    <input
                      type="text"
                      inputMode="numeric"
                      min={1}
                      max={MAX_CAPACITY}
                      maxLength={2}
                      className={inputCls}
                      value={capacityTotal}
                      onChange={(event) => updateCapacityTotal(event.target.value)}
                    />
                  </Field>
                  <Field label={ka ? "ადგილები" : "Spots"}>
                    <input
                      type="text"
                      inputMode="numeric"
                      min={0}
                      max={capacityTotal}
                      maxLength={2}
                      className={inputCls}
                      value={spotsAvailable}
                      onChange={(event) => updateSpotsAvailable(event.target.value)}
                    />
                  </Field>
                </div>

                <Field
                  label={ka ? "შენიშვნა (არასავალდებულო)" : "Notes (optional)"}
                  hint={ka ? "მაგ. აღების ადგილი ან დამატებითი პირობები." : "e.g. pickup spot or extra conditions."}
                >
                  <textarea
                    rows={4}
                    className={textAreaCls}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </Field>

                {error && (
                  <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row">
                  <Link
                    href={`/listing/${listing.id}?lang=${lang}`}
                    className="flex h-[58px] flex-1 items-center justify-center rounded-[25px] border border-slate-200 bg-white px-6 text-base font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    {ka ? "გაუქმება" : "Cancel"}
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-[58px] flex-1 items-center justify-center gap-2 rounded-[25px] bg-gradient-to-r from-sky-600 to-blue-700 px-6 text-base font-bold text-white shadow-[0_14px_34px_rgba(2,132,199,0.22)] transition hover:from-sky-500 hover:to-blue-600 disabled:opacity-50"
                  >
                    {loading ? (
                      ka ? "ინახება..." : "Saving..."
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        {ka ? "შენახვა" : "Save changes"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="border-t border-sky-100 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.16),transparent_34%),linear-gradient(155deg,#f8fcff_0%,#eef8ff_58%,#fff8ef_100%)] p-6 text-slate-900 lg:border-l lg:border-t-0 sm:p-8">
              <div className="sticky top-6 rounded-[30px] border border-white/90 bg-white/88 p-5 shadow-[0_20px_55px_rgba(2,74,122,0.1)] backdrop-blur">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-700">
                  {ka ? "წინასწარი ხედი" : "Preview"}
                </div>

                <div className="mt-4 flex items-center gap-4 rounded-[24px] border border-sky-100 bg-sky-50/80 px-4 py-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 text-white">
                    <VehicleGlyph kind={vehicleKind(vehicleType)} className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      {ka ? "ტრანსპორტი" : "Vehicle"}
                    </div>
                    <div className="mt-1 text-base font-bold text-slate-900">{displayVehicle}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    {ka ? "მარშრუტი" : "Route"}
                  </div>
                  <div className="mt-2 text-2xl font-black tracking-tight">
                    {displayFromCity}
                    <span className="mx-2 text-orange-400">→</span>
                    {displayToCity}
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      <PhoneIcon className="h-3.5 w-3.5" />
                      {ka ? "კონტაქტი" : "Contact"}
                    </div>
                    <div className="mt-1 text-base font-bold text-slate-900">{displayName}</div>
                    <div className="mt-1 text-sm text-slate-500">{phone}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {ka ? "ფასი" : "Price"}
                      </div>
                      <div className="mt-1 text-lg font-black text-slate-900">{price}₾</div>
                    </div>

                    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                        <CapacityIcon className="h-3.5 w-3.5" />
                        {ka ? "ადგილები" : "Spots"}
                      </div>
                      <div className="mt-1 text-lg font-black text-slate-900">
                        {spotsAvailable}/{capacityTotal}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      <NoteIcon className="h-3.5 w-3.5" />
                      {ka ? "შენიშვნა" : "Notes"}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-slate-600">
                      {notes.trim() || (ka ? "შენიშვნა არ არის დამატებული." : "No note added.")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
