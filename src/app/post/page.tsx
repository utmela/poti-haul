"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { StylizedDropdown } from "@/components/stylized-dropdown";
import {
  ArrowRightIcon,
  CalendarIcon,
  CapacityIcon,
  CheckIcon,
  MapPinIcon,
  NoteIcon,
  PhoneIcon,
  RouteIcon,
  SearchIcon,
  VehicleGlyph,
} from "@/components/site-icons";
import { createListing } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  getAccountRole,
  type AccountRole,
  type MarketplaceRole,
} from "@/lib/account-role";
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
import { supabase } from "@/lib/supabase";
import type { CreateListingInput } from "@/lib/types";

function normalizePhone(raw: string) {
  return raw.replace(/\s+/g, "").trim();
}

function isValidGePhone(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits.startsWith("+995")
    ? /^\+995\d{9}$/.test(digits)
    : /^5\d{8}$/.test(digits);
}

function defaultDatetime() {
  const date = new Date(Date.now() + 3 * 36e5);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function Stepper({
  step,
  labels,
}: {
  step: number;
  labels: string[];
}) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-3">
      {labels.map((label, index) => {
        const number = index + 1;
        const active = number === step;
        const done = number < step;

        return (
          <div
            key={label}
            className={`rounded-[26px] border px-4 py-4 transition ${
              active
                ? "border-sky-300 bg-sky-50 shadow-[0_12px_32px_rgba(2,132,199,0.12)]"
                : done
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                  active
                    ? "bg-gradient-to-br from-sky-600 to-blue-700 text-white"
                    : done
                      ? "bg-emerald-500 text-white"
                      : "border border-slate-200 bg-white text-slate-400"
                }`}
              >
                {done ? <CheckIcon className="h-4 w-4" /> : number}
              </div>

              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Step {number}
                </div>
                <div
                  className={`text-sm font-bold ${
                    active
                      ? "text-slate-950"
                      : done
                        ? "text-emerald-700"
                        : "text-slate-500"
                  }`}
                >
                  {label}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
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

function RoleGate({
  lang,
  role,
  saving,
  error,
  onChoose,
  onBrowse,
  onBack,
}: {
  lang: Lang;
  role: AccountRole;
  saving: boolean;
  error: string | null;
  onChoose: (role: MarketplaceRole) => void;
  onBrowse: () => void;
  onBack: () => void;
}) {
  const ka = lang === "ka";
  const isCustomer = role === "customer";

  return (
    <main lang={lang} className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="mx-auto w-full max-w-[1180px]">
        <button
          type="button"
          onClick={onBack}
          className="mb-5 inline-flex min-h-12 items-center gap-2 rounded-[22px] border border-slate-200 bg-white/85 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-white"
        >
          <span>←</span>
          {ka ? "უკან" : "Back"}
        </button>

        <div className="overflow-hidden rounded-[36px] border border-white/80 bg-white/90 shadow-[0_28px_90px_rgba(2,74,122,0.14)] backdrop-blur">
          <div className="grid lg:grid-cols-[1fr_0.9fr]">
            <section className="bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.16),transparent_34%),linear-gradient(160deg,#ffffff_0%,#f0f9ff_58%,#fff7ed_100%)] p-6 sm:p-9">
              <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold text-orange-700">
                {ka ? "აირჩიე მოქმედება" : "Choose action"}
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {isCustomer
                  ? ka
                    ? "განცხადების დასამატებლად გადამზიდავის როლი აირჩიე"
                    : "Switch to provider to publish a listing"
                  : ka
                    ? "რას აკეთებ დღეს?"
                    : "What are you doing today?"}
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                {ka
                  ? "აირჩიე სთავაზობ ტრანსპორტირების სერვისს თუ ეძებ ტრანსპორტს. განცხადების ფორმა გაიხსნება მხოლოდ სერვისის შეთავაზებისთვის."
                  : "Choose whether you offer transport or need transport. The listing form opens only for service providers."}
              </p>

              <div className="mt-7 grid gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onChoose("provider")}
                  className="flex items-start gap-4 rounded-[28px] border border-sky-300 bg-sky-50 p-6 text-left transition hover:bg-white disabled:opacity-60"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 text-white">
                    <VehicleGlyph kind="carrier" className="h-8 w-8" />
                  </span>
                  <span>
                    <span className="block text-base font-black text-slate-950">
                      {ka ? "ვთავაზობ ტრანსპორტს" : "I offer transport"}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-500">
                      {ka
                        ? "გახსენი ფორმა, დაამატე მარშრუტი, ფასი და საკონტაქტო ინფორმაცია."
                        : "Open the listing form and add your route, price, and contact details."}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onChoose("customer")}
                  className="flex items-start gap-4 rounded-[28px] border border-slate-200 bg-white/85 p-6 text-left transition hover:border-orange-200 hover:bg-orange-50/60 disabled:opacity-60"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                    <SearchIcon className="h-7 w-7" />
                  </span>
                  <span>
                    <span className="block text-base font-black text-slate-950">
                      {ka ? "ვეძებ / ვითხოვ ტრანსპორტს" : "I need / request transport"}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-500">
                      {ka
                        ? "შეგინახავთ მაძიებლის როლს და გადაგიყვანთ განცხადებების ძებნაზე."
                        : "We will save you as a seeker and take you back to search listings."}
                    </span>
                  </span>
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {saving && (
                <div className="mt-4 rounded-[22px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">
                  {ka ? "ინახება..." : "Saving..."}
                </div>
              )}
            </section>

            <aside className="border-t border-sky-100 bg-white/72 p-6 lg:border-l lg:border-t-0 sm:p-9">
              <div className="flex h-full flex-col justify-center rounded-[30px] border border-sky-100 bg-sky-50/80 p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white text-sky-700 shadow-[0_14px_32px_rgba(2,132,199,0.12)]">
                  <CheckIcon className="h-8 w-8" />
                </div>
                <h2 className="mt-5 text-2xl font-black text-slate-950">
                  {ka ? "სტუმრებს ნახვა შეუძლიათ" : "Guests can still browse"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {ka
                    ? "ანგარიში და როლი საჭიროა მხოლოდ განცხადების დასამატებლად. ნახვა ყველასთვის ღია რჩება."
                    : "Accounts and roles are only needed for posting. Public listings stay open for everyone."}
                </p>
                <button
                  type="button"
                  onClick={onBrowse}
                  className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-[22px] border border-sky-200 bg-white px-5 py-3 text-sm font-bold text-sky-700 transition hover:bg-sky-50"
                >
                  <SearchIcon className="h-4 w-4" />
                  {ka ? "განცხადებების ნახვა" : "Browse listings"}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PostListingPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [lang, setLang] = useState<Lang>(() =>
    typeof window === "undefined" ? "ka" : languageFromSearch(window.location.search)
  );
  const ka = lang === "ka";
  const accountRole = getAccountRole(user, profile);
  const [localRole, setLocalRole] = useState<AccountRole>(accountRole);
  const [roleConfirmed, setRoleConfirmed] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/auth?lang=${lang}&next=${encodeURIComponent("/post")}`);
    }
  }, [authLoading, lang, router, user]);

  useEffect(() => {
    setLocalRole(accountRole);
  }, [accountRole]);

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [fromCity, setFromCity] = useState("Poti");
  const [toCity, setToCity] = useState("Tbilisi");
  const [customFromCity, setCustomFromCity] = useState("");
  const [customToCity, setCustomToCity] = useState("");
  const [vehicleType, setVehicleType] = useState("Tow truck");
  const [price, setPrice] = useState(400);
  const [capacityTotal, setCapacityTotal] = useState(2);
  const [spotsAvailable, setSpotsAvailable] = useState(1);
  const [availableFrom, setAvailableFrom] = useState(defaultDatetime());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const finalFromCity = fromCity === "Other" ? customFromCity.trim() : fromCity;
  const finalToCity = toCity === "Other" ? customToCity.trim() : toCity;

  const stepLabels = ka
    ? ["ვინ ხარ", "მარშრუტი", "დეტალები"]
    : ["Who you are", "Route", "Details"];

  const cityOptions = useMemo(
    () =>
      CITY_OPTIONS.map((city) => ({
        value: city.value,
        label: lang === "ka" ? city.ka : city.en,
        icon: <MapPinIcon className="h-4 w-4" />,
      })),
    [lang]
  );

  const displayVehicle = useMemo(
    () => vehicleLabel(vehicleType, lang),
    [vehicleType, lang]
  );
  const displayFromCity = useMemo(
    () => cityLabel(finalFromCity || fromCity, lang),
    [finalFromCity, fromCity, lang]
  );
  const displayToCity = useMemo(
    () => cityLabel(finalToCity || toCity, lang),
    [finalToCity, toCity, lang]
  );

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

  function validateStep(currentStep: number): string | null {
    if (currentStep === 1) {
      if (!displayName.trim()) {
        return ka ? "შეიყვანე სახელი ან სერვისის სახელწოდება." : "Enter your name or service.";
      }

      const normalizedPhone = normalizePhone(phone);
      if (!isValidGePhone(normalizedPhone)) {
        return ka
          ? "ტელეფონის ფორმატი უნდა იყოს +995555123456 ან 555123456."
          : "Phone format must be +995555123456 or 555123456.";
      }
    }

    if (currentStep === 2) {
      if (!finalFromCity) {
        return ka ? "აირჩიე გამგზავრების ქალაქი." : "Choose the departure city.";
      }
      if (!finalToCity) {
        return ka ? "აირჩიე დანიშნულების ქალაქი." : "Choose the destination city.";
      }
      if (finalFromCity.trim().toLowerCase() === finalToCity.trim().toLowerCase()) {
        return ka
          ? "საიდან და სადამდე ერთნაირი ვერ იქნება."
          : "From and To cannot be the same.";
      }
    }

    if (currentStep === 3) {
      if (price < 0) return ka ? "ფასი უნდა იყოს 0 ან მეტი." : "Price must be 0 or more.";
      if (capacityTotal < 1) return ka ? "ტევადობა მინიმუმ 1 უნდა იყოს." : "Capacity must be at least 1.";
      if (spotsAvailable < 0) return ka ? "ადგილები უარყოფითი ვერ იქნება." : "Spots cannot be negative.";
      if (spotsAvailable > capacityTotal) {
        return ka ? "ადგილები ტევადობაზე მეტია." : "Spots exceed capacity.";
      }
    }

    return null;
  }

  function next() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setStep((current) => current + 1);
  }

  async function submit() {
    const validationError = validateStep(3);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const payload: CreateListingInput = {
        from_city: finalFromCity,
        to_city: finalToCity,
        price_gel: price,
        capacity_total: capacityTotal,
        spots_available: spotsAvailable,
        available_from: new Date(availableFrom).toISOString(),
        driver_display_name: displayName.trim(),
        driver_phone: normalizePhone(phone),
        vehicle_type: vehicleType,
        notes: notes.trim() || null,
        user_id: user?.id ?? null,
      };

      await createListing(payload);
      setDone(true);

      setTimeout(() => {
        router.push(`/?lang=${lang}`);
        router.refresh();
      }, 1500);
    } catch (unknownError: unknown) {
      setError(unknownError instanceof Error ? unknownError.message : ka ? "შეცდომა." : "Error.");
    } finally {
      setLoading(false);
    }
  }

  function toggleLanguage() {
    const nextLang = lang === "en" ? "ka" : "en";
    setLang(nextLang);
    router.replace(`/post?lang=${nextLang}`, { scroll: false });
  }

  const inputCls =
    "h-[58px] w-full rounded-[25px] border border-slate-200 bg-white px-4 text-[15px] font-semibold text-slate-900 placeholder:text-slate-400 shadow-[0_10px_24px_rgba(15,23,42,0.04)] outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100";
  const textAreaCls =
    "w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-[15px] font-semibold text-slate-900 placeholder:text-slate-400 shadow-[0_10px_24px_rgba(15,23,42,0.04)] outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100";

  async function chooseMarketplaceRole(nextRole: MarketplaceRole) {
    if (!user) return;

    setLoading(true);
    setError(null);

    if (nextRole === "provider" && (localRole === "provider" || localRole === "admin")) {
      setRoleConfirmed(true);
      setLoading(false);
      return;
    }

    const { error: roleError } = await supabase.auth.updateUser({
      data: { marketplace_role: nextRole },
    });

    if (roleError) {
      setError(roleError.message);
      setLoading(false);
      return;
    }

    if (nextRole === "provider") {
      await supabase
        .from("profiles")
        .update({ role: "driver" })
        .eq("id", user.id);
      setLocalRole("provider");
      setRoleConfirmed(true);
      setLoading(false);
      return;
    }

    setLocalRole("customer");
    setLoading(false);
    router.push(`/?lang=${lang}`);
  }

  if (authLoading || !user) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center text-slate-500">
        <div className="flex items-center rounded-[24px] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
          <svg className="mr-3 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8Z" />
          </svg>
          {ka ? "იტვირთება..." : "Loading..."}
        </div>
      </main>
    );
  }

  if (!roleConfirmed) {
    return (
      <RoleGate
        lang={lang}
        role={localRole}
        saving={loading}
        error={error}
        onChoose={(role) => void chooseMarketplaceRole(role)}
        onBrowse={() => router.push(`/?lang=${lang}`)}
        onBack={() => router.push(`/?lang=${lang}`)}
      />
    );
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-[32px] border border-white/80 bg-white/88 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-sky-600 to-blue-700 text-white shadow-[0_18px_44px_rgba(2,132,199,0.22)]">
            <CheckIcon className="h-9 w-9" />
          </div>
          <div className="mt-4 text-2xl font-black text-slate-950">
            {ka ? "განცხადება გამოქვეყნდა!" : "Listing posted!"}
          </div>
          <div className="mt-2 text-sm text-slate-500">
            {ka ? "მთავარ გვერდზე გადამისამართება..." : "Redirecting to homepage..."}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main lang={lang} className="min-h-screen">
      <div className="mx-auto w-full max-w-[1360px] px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href={`/?lang=${lang}`}
            className="inline-flex min-h-12 items-center gap-2 rounded-[22px] border border-slate-200 bg-white/85 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            <span>←</span>
            {ka ? "უკან" : "Back"}
          </Link>

          <button
            onClick={toggleLanguage}
            className="flex min-h-12 items-center gap-2 rounded-[22px] border border-slate-200 bg-white/85 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            <img
              src={lang === "en" ? "https://flagcdn.com/w20/ge.png" : "https://flagcdn.com/w20/gb.png"}
              width={18}
              height={13}
              alt=""
              className="rounded-sm"
            />
            {lang === "en" ? "ქართული" : "English"}
          </button>
        </div>

        <div className="overflow-hidden rounded-[36px] border border-white/80 bg-white/84 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-6 sm:p-8">
              <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">
                {ka ? "განცხადების დამატება" : "Create listing"}
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {ka ? "ახალი სატრანსპორტო შეთავაზება" : "Create a polished transport listing"}
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                {ka
                  ? "დაამატე სუფთა, გასაგები განცხადება და მიიღე პირდაპირი ზარები მომხმარებლებისგან."
                  : "Publish a clear, professional listing and receive direct calls from customers."}
              </p>

              <div className="mt-8">
                <Stepper step={step} labels={stepLabels} />
              </div>

              {step === 1 && (
                <div className="grid gap-5">
                  <Field label={ka ? "შენი სახელი / სერვისი" : "Your name / service"}>
                    <input
                      className={inputCls}
                      placeholder={ka ? "მაგ. Gio Tow Service" : "e.g. Gio Tow Service"}
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                    />
                  </Field>

                  <Field
                    label={ka ? "ტელეფონის ნომერი" : "Phone number"}
                    hint={
                      ka
                        ? "ეს ნომერი საჯაროდ გამოჩნდება. WhatsApp ნომერი საუკეთესოა."
                        : "This number will be public. A WhatsApp number works best."
                    }
                  >
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <PhoneIcon className="h-5 w-5" />
                      </span>
                      <input
                        className={`${inputCls} pl-12`}
                        placeholder="+995 555 123 456"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                      />
                    </div>
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label={ka ? "საიდან" : "From"}>
                      <StylizedDropdown
                        value={fromCity}
                        onChange={setFromCity}
                        options={cityOptions}
                        placeholder={ka ? "აირჩიე ქალაქი" : "Choose city"}
                        buttonIcon={<MapPinIcon className="h-4 w-4" />}
                      />

                      {fromCity === "Other" && (
                        <input
                          className={inputCls}
                          placeholder={ka ? "ქალაქის სახელი" : "City name"}
                          value={customFromCity}
                          onChange={(event) => setCustomFromCity(event.target.value)}
                        />
                      )}
                    </Field>

                    <Field label={ka ? "სადამდე" : "To"}>
                      <StylizedDropdown
                        value={toCity}
                        onChange={setToCity}
                        options={cityOptions}
                        placeholder={ka ? "აირჩიე ქალაქი" : "Choose city"}
                        buttonIcon={<RouteIcon className="h-4 w-4" />}
                      />

                      {toCity === "Other" && (
                        <input
                          className={inputCls}
                          placeholder={ka ? "ქალაქის სახელი" : "City name"}
                          value={customToCity}
                          onChange={(event) => setCustomToCity(event.target.value)}
                        />
                      )}
                    </Field>
                  </div>

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
                </div>
              )}

              {step === 3 && (
                <div className="grid gap-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

                    <Field label={ka ? "თავისუფალი ადგილები" : "Available spots"}>
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

                  <Field label={ka ? "ხელმისაწვდომია" : "Available from"}>
                    <input
                      type="datetime-local"
                      className={inputCls}
                      value={availableFrom}
                      onChange={(event) => setAvailableFrom(event.target.value)}
                    />
                  </Field>

                  <Field
                    label={ka ? "შენიშვნა (არასავალდებულო)" : "Notes (optional)"}
                    hint={
                      ka
                        ? "მაგ. აღების ადგილი, დამატებითი პირობები ან სხვა სასარგებლო ინფორმაცია."
                        : "For example, pickup spot, extra conditions, or any useful information."
                    }
                  >
                    <textarea
                      rows={4}
                      className={textAreaCls}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder={
                        ka
                          ? "მაგ. დამირეკეთ ჩამოსვლამდე 20 წუთით ადრე"
                          : "e.g. Call me 20 minutes before arrival"
                      }
                    />
                  </Field>
                </div>
              )}

              {error && (
                <div className="mt-6 rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep((current) => current - 1);
                    }}
                    className="h-[58px] flex-1 rounded-[25px] border border-slate-200 bg-white px-6 text-base font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    {ka ? "უკან" : "Back"}
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={next}
                    className="inline-flex h-[58px] flex-1 items-center justify-center gap-2 rounded-[25px] bg-gradient-to-r from-sky-600 to-blue-700 px-6 text-base font-bold text-white shadow-[0_14px_34px_rgba(2,132,199,0.22)] transition hover:from-sky-500 hover:to-blue-600"
                  >
                    {ka ? "შემდეგი" : "Next"}
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void submit()}
                    disabled={loading}
                    className="inline-flex h-[58px] flex-1 items-center justify-center gap-2 rounded-[25px] bg-gradient-to-r from-sky-600 to-blue-700 px-6 text-base font-bold text-white shadow-[0_14px_34px_rgba(2,132,199,0.22)] transition hover:from-sky-500 hover:to-blue-600 disabled:opacity-50"
                  >
                    {loading ? (
                      ka ? "იგზავნება..." : "Submitting..."
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        {ka ? "გამოქვეყნება" : "Publish listing"}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-sky-100 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.16),transparent_34%),linear-gradient(155deg,#f8fcff_0%,#eef8ff_58%,#fff8ef_100%)] p-6 text-slate-900 lg:border-l lg:border-t-0 sm:p-8">
              <div className="sticky top-6">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
                  {ka ? "ცოცხალი წინასწარი ხედი" : "Live preview"}
                </div>

                <div className="mt-5 rounded-[30px] border border-white/90 bg-white/88 p-5 shadow-[0_20px_55px_rgba(2,74,122,0.1)] backdrop-blur">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {ka ? "მარშრუტი" : "Route"}
                      </div>
                      <div className="mt-1 text-2xl font-black tracking-tight">
                        {displayFromCity || (ka ? "საიდან" : "From")}
                        <span className="mx-2 text-orange-400">→</span>
                        {displayToCity || (ka ? "სადამდე" : "To")}
                      </div>
                    </div>

                    <div className="rounded-full bg-orange-500 px-3 py-1 text-xs font-black text-white">
                      {step}/3
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-4 rounded-[24px] border border-sky-100 bg-sky-50/80 px-4 py-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 text-white">
                      <VehicleGlyph kind={vehicleKind(vehicleType)} className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {ka ? "ტრანსპორტი" : "Vehicle"}
                      </div>
                      <div className="mt-1 text-base font-bold text-slate-900">{displayVehicle}</div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-3">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        <PhoneIcon className="h-3.5 w-3.5" />
                        {ka ? "მძღოლი / სერვისი" : "Driver / service"}
                      </div>
                      <div className="mt-1 text-base font-bold text-slate-900">
                        {displayName.trim() || (ka ? "შენი სახელი" : "Your name")}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">{phone.trim() || "+995 555 123 456"}</div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          <CapacityIcon className="h-3.5 w-3.5" />
                          {ka ? "ფასი" : "Price"}
                        </div>
                        <div className="mt-1 text-lg font-black text-slate-900">{price}₾</div>
                      </div>

                      <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          <CapacityIcon className="h-3.5 w-3.5" />
                          {ka ? "ტევადობა" : "Capacity"}
                        </div>
                        <div className="mt-1 text-lg font-black text-slate-900">{capacityTotal}</div>
                      </div>

                      <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          <CapacityIcon className="h-3.5 w-3.5" />
                          {ka ? "ადგილები" : "Spots"}
                        </div>
                        <div className="mt-1 text-lg font-black text-slate-900">{spotsAvailable}</div>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-3">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {ka ? "ხელმისაწვდომია" : "Available from"}
                      </div>
                      <div className="mt-1 text-base font-bold text-slate-900">
                        {availableFrom
                          ? new Date(availableFrom).toLocaleString(lang === "ka" ? "ka-GE" : "en-US")
                          : "—"}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-3">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        <NoteIcon className="h-3.5 w-3.5" />
                        {ka ? "შენიშვნა" : "Notes"}
                      </div>
                      <div className="mt-1 text-sm leading-6 text-slate-600">
                        {notes.trim() ||
                          (ka
                            ? "დამატებითი ინფორმაცია ჯერ მითითებული არ არის."
                            : "No additional information yet.")}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {ka
                      ? "რჩევა: სწორი მარშრუტი, WhatsApp ნომერი და მოკლე შენიშვნა მეტ ზარს მოგიტანს."
                      : "Tip: A clear route, WhatsApp number, and short note usually bring more calls."}
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
