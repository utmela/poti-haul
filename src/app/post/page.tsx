"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createListing } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { CreateListingInput } from "@/lib/types";

const CITIES = [
  { en: "Tbilisi", ka: "თბილისი" },
  { en: "Kutaisi", ka: "ქუთაისი" },
  { en: "Batumi", ka: "ბათუმი" },
  { en: "Zugdidi", ka: "ზუგდიდი" },
  { en: "Gori", ka: "გორი" },
  { en: "Rustavi", ka: "რუსთავი" },
  { en: "Telavi", ka: "თელავი" },
  { en: "Borjomi", ka: "ბორჯომი" },
  { en: "Bakuriani", ka: "ბაკურიანი" },
  { en: "Gudauri", ka: "გუდაური" },
  { en: "Other", ka: "სხვა" },
];

const VEHICLES = [
  { en: "Tow truck", ka: "ამწე", icon: "🚛" },
  { en: "Car carrier", ka: "ავტოვოზი", icon: "🚗" },
  { en: "Trailer", ka: "მისაბმელი", icon: "🚜" },
  { en: "Minivan (with trailer)", ka: "მინივენი (მისაბმელით)", icon: "🚐" },
  { en: "Other", ka: "სხვა", icon: "🔧" },
];

function normalizePhone(raw: string) {
  return raw.replace(/\s+/g, "").trim();
}

function isValidGePhone(phone: string) {
  const s = phone.replace(/[^\d+]/g, "");
  return s.startsWith("+995") ? /^\+995\d{9}$/.test(s) : /^5\d{8}$/.test(s);
}

function defaultDatetime() {
  const d = new Date(Date.now() + 3 * 36e5);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function translateVehicle(type: string, lang: "en" | "ka") {
  const v = type.trim().toLowerCase();

  if (lang === "ka") {
    if (v.includes("tow")) return "ამწე";
    if (v.includes("carrier")) return "ავტოვოზი";
    if (v.includes("trailer")) return "მისაბმელი";
    if (v.includes("minivan")) return "მინივენი (მისაბმელით)";
    if (v.includes("other")) return "სხვა";
    return type;
  }

  if (v.includes("ამწე")) return "Tow truck";
  if (v.includes("ავტოვოზი")) return "Car carrier";
  if (v.includes("მისაბმელი")) return "Trailer";
  if (v.includes("მინივენი")) return "Minivan (with trailer)";
  if (v.includes("სხვა")) return "Other";
  return type;
}

function translateCity(city: string, lang: "en" | "ka") {
  const c = city.trim().toLowerCase();

  const mapKa: Record<string, string> = {
    tbilisi: "თბილისი",
    kutaisi: "ქუთაისი",
    batumi: "ბათუმი",
    zugdidi: "ზუგდიდი",
    gori: "გორი",
    rustavi: "რუსთავი",
    telavi: "თელავი",
    borjomi: "ბორჯომი",
    bakuriani: "ბაკურიანი",
    gudauri: "გუდაური",
    poti: "ფოთი",
    other: "სხვა",
  };

  const mapEn: Record<string, string> = {
    "თბილისი": "Tbilisi",
    "ქუთაისი": "Kutaisi",
    "ბათუმი": "Batumi",
    "ზუგდიდი": "Zugdidi",
    "გორი": "Gori",
    "რუსთავი": "Rustavi",
    "თელავი": "Telavi",
    "ბორჯომი": "Borjomi",
    "ბაკურიანი": "Bakuriani",
    "გუდაური": "Gudauri",
    "ფოთი": "Poti",
    "სხვა": "Other",
  };

  return lang === "ka" ? mapKa[c] ?? city : mapEn[city.trim()] ?? city;
}

function Stepper({
  step,
  labels,
}: {
  step: number;
  labels: string[];
}) {
  return (
    <div className="mb-8 grid grid-cols-3 gap-3">
      {labels.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;

        return (
          <div key={label} className="relative">
            <div
              className={`rounded-2xl border px-4 py-4 transition ${
                active
                  ? "border-orange-200 bg-orange-50"
                  : done
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                    active
                      ? "bg-orange-500 text-white"
                      : done
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-gray-400 border border-gray-200"
                  }`}
                >
                  {done ? "✓" : n}
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">
                    Step {n}
                  </div>
                  <div
                    className={`text-sm font-bold ${
                      active
                        ? "text-orange-700"
                        : done
                        ? "text-emerald-700"
                        : "text-gray-500"
                    }`}
                  >
                    {label}
                  </div>
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
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-bold text-gray-800">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export default function PostListingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [lang, setLang] = useState<"en" | "ka">("ka");
  const ka = lang === "ka";

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth");
  }, [authLoading, user, router]);

  const [step, setStep] = useState(1);

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  const [toCity, setToCity] = useState("Tbilisi");
  const [customCity, setCustomCity] = useState("");
  const [vehicleType, setVehicleType] = useState("Tow truck");

  const [price, setPrice] = useState(400);
  const [capacityTotal, setCapacityTotal] = useState(2);
  const [spotsAvailable, setSpotsAvailable] = useState(1);
  const [availableFrom, setAvailableFrom] = useState(defaultDatetime());
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const finalCity = toCity === "Other" ? customCity.trim() : toCity;

  const stepLabels = ka
    ? ["ვინ ხარ", "მარშრუტი", "დეტალები"]
    : ["Who you are", "Route", "Details"];

  const inputCls =
    "h-14 w-full rounded-2xl border border-gray-300 bg-white px-4 text-[15px] font-medium text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

  const textAreaCls =
    "w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[15px] font-medium text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!displayName.trim()) {
        return ka ? "შეიყვანეთ სახელი." : "Enter your name.";
      }

      const p = normalizePhone(phone);
      if (!isValidGePhone(p)) {
        return ka
          ? "ტელეფონის ფორმატი: +995555123456 ან 555123456"
          : "Phone format: +995555123456 or 555123456";
      }
    }

    if (s === 2) {
      if (!finalCity) {
        return ka ? "აირჩიეთ ქალაქი." : "Choose a city.";
      }
    }

    if (s === 3) {
      if (price < 0) return ka ? "ფასი უნდა იყოს 0 ან მეტი." : "Price must be 0 or more.";
      if (capacityTotal < 1) return ka ? "ტევადობა მინ. 1." : "Capacity must be at least 1.";
      if (spotsAvailable < 0) return ka ? "ადგილები უარყოფითი ვერ იქნება." : "Spots cannot be negative.";
      if (spotsAvailable > capacityTotal) {
        return ka ? "ადგილები ტევადობას აჭარბებს." : "Spots exceed capacity.";
      }
    }

    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => s + 1);
  }

  async function submit() {
    const err = validateStep(3);
    if (err) {
      setError(err);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const payload: CreateListingInput = {
        from_city: "Poti",
        to_city: finalCity,
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
        router.push("/");
        router.refresh();
      }, 1800);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : ka ? "შეცდომა." : "Error.");
    } finally {
      setLoading(false);
    }
  }

  const displayVehicle = useMemo(() => translateVehicle(vehicleType, lang), [vehicleType, lang]);
  const displayToCity = useMemo(() => translateCity(finalCity || toCity, lang), [finalCity, toCity, lang]);

  if (authLoading || !user) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] text-gray-500">
        <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <svg className="mr-3 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {ka ? "იტვირთება..." : "Loading..."}
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] p-6">
        <div className="w-full max-w-md rounded-[28px] border border-gray-200 bg-white p-8 text-center shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
          <div className="text-6xl">✅</div>
          <div className="mt-4 text-2xl font-black text-gray-950">
            {ka ? "განცხადება გამოქვეყნდა!" : "Listing posted!"}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {ka ? "გადამისამართება მთავარ გვერდზე..." : "Redirecting to homepage..."}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]">
      {/* <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6"> */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
          >
            ← {ka ? "უკან" : "Back"}
          </Link>

          <button
            onClick={() => setLang(lang === "en" ? "ka" : "en")}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
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

        <div className="overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-8">
              <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">
                {ka ? "განცხადების დამატება" : "Create listing"}
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                {ka ? "ტრანსპორტის განცხადება" : "Post a transport listing"}
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
                {ka
                  ? "დაამატე ტრანსპორტის განცხადება ფოთიდან სასურველ ქალაქამდე და მიიღე ზარები პირდაპირ მომხმარებლებისგან."
                  : "Add a transport listing from Poti to your desired city and receive direct calls from customers."}
              </p>

              <div className="mt-8">
                <Stepper step={step} labels={stepLabels} />
              </div>

              {step === 1 && (
                <div className="grid gap-5">
                  <Field label={ka ? "შენი სახელი / სერვისი" : "Your name / service"}>
                    <input
                      className={inputCls}
                      placeholder={ka ? "მაგ. გიო ამწის სერვისი" : "e.g. Gio Tow Service"}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </Field>

                  <Field
                    label={ka ? "ტელეფონის ნომერი" : "Phone number"}
                    hint={
                      ka
                        ? "ეს ნომერი საჯაროდ გამოჩნდება. WhatsApp-ის ნომერი უკეთესია."
                        : "This number will be public. A WhatsApp number is preferred."
                    }
                  >
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-400">📞</span>
                      <input
                        className={`${inputCls} pl-11`}
                        placeholder="+995 555 123 456"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-5">
                  <Field label={ka ? "საიდან" : "From"}>
                    <div className="flex h-14 items-center rounded-2xl border border-orange-200 bg-orange-50 px-4 text-sm font-bold text-orange-700">
                      📍 {ka ? "ფოთი (ფიქსირებული)" : "Poti (fixed)"}
                    </div>
                  </Field>

                  <Field label={ka ? "სადამდე" : "To"}>
                    <select
                      className={inputCls}
                      value={toCity}
                      onChange={(e) => setToCity(e.target.value)}
                    >
                      {CITIES.map((c) => (
                        <option key={c.en} value={c.en}>
                          {ka ? c.ka : c.en}
                        </option>
                      ))}
                    </select>

                    {toCity === "Other" && (
                      <input
                        className={inputCls}
                        placeholder={ka ? "ქალაქის სახელი" : "City name"}
                        value={customCity}
                        onChange={(e) => setCustomCity(e.target.value)}
                      />
                    )}
                  </Field>

                  <Field label={ka ? "ტრანსპორტის ტიპი" : "Vehicle type"}>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {VEHICLES.map((v) => {
                        const selected = vehicleType === v.en;

                        return (
                          <button
                            key={v.en}
                            type="button"
                            onClick={() => setVehicleType(v.en)}
                            className={`rounded-2xl border px-4 py-4 text-left transition ${
                              selected
                                ? "border-orange-300 bg-orange-50 shadow-sm"
                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="text-2xl">{v.icon}</div>
                            <div className={`mt-2 text-sm font-bold ${selected ? "text-orange-700" : "text-gray-800"}`}>
                              {ka ? v.ka : v.en}
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
                        type="number"
                        min={0}
                        className={inputCls}
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                      />
                    </Field>

                    <Field label={ka ? "ტევადობა" : "Capacity"}>
                      <input
                        type="number"
                        min={1}
                        className={inputCls}
                        value={capacityTotal}
                        onChange={(e) => setCapacityTotal(Number(e.target.value))}
                      />
                    </Field>

                    <Field label={ka ? "თავისუფალი ადგილები" : "Available spots"}>
                      <input
                        type="number"
                        min={0}
                        max={capacityTotal}
                        className={inputCls}
                        value={spotsAvailable}
                        onChange={(e) => setSpotsAvailable(Number(e.target.value))}
                      />
                    </Field>
                  </div>

                  <Field label={ka ? "ხელმისაწვდომია" : "Available from"}>
                    <input
                      type="datetime-local"
                      className={inputCls}
                      value={availableFrom}
                      onChange={(e) => setAvailableFrom(e.target.value)}
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
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={ka ? "მაგ. პორტის მახლობლად ვარ" : "e.g. I’m near the port"}
                    />
                  </Field>
                </div>
              )}

              {error && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  ⚠️ {error}
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep((s) => s - 1);
                    }}
                    className="h-14 flex-1 rounded-2xl border border-gray-300 bg-white px-5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                  >
                    ← {ka ? "უკან" : "Back"}
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={next}
                    className="h-14 flex-1 rounded-2xl bg-orange-500 px-5 text-sm font-bold text-white transition hover:bg-orange-600"
                  >
                    {ka ? "შემდეგი →" : "Next →"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={loading}
                    className="h-14 flex-1 rounded-2xl bg-emerald-500 px-5 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {loading
                      ? ka
                        ? "იგზავნება..."
                        : "Submitting..."
                      : ka
                      ? "✓ გამოქვეყნება"
                      : "✓ Publish listing"}
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 p-6 text-white lg:border-l lg:border-t-0 sm:p-8">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
                {ka ? "ცოცხალი წინასწარი ხედი" : "Live preview"}
              </div>

              <div className="mt-5 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-inner backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                      {ka ? "მარშრუტი" : "Route"}
                    </div>
                    <div className="mt-1 text-2xl font-black tracking-tight">
                      {ka ? "ფოთი" : "Poti"}
                      <span className="mx-2 text-orange-400">→</span>
                      {displayToCity || (ka ? "ქალაქი" : "City")}
                    </div>
                  </div>
                  <div className="rounded-full bg-orange-500 px-3 py-1 text-xs font-black text-white">
                    {step === 1 ? "1/3" : step === 2 ? "2/3" : "3/3"}
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                      {ka ? "მძღოლი / სერვისი" : "Driver / service"}
                    </div>
                    <div className="mt-1 text-base font-bold text-white">
                      {displayName.trim() || (ka ? "შენი სახელი" : "Your name")}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                      {ka ? "ტელეფონი" : "Phone"}
                    </div>
                    <div className="mt-1 text-base font-bold text-white/95">
                      {phone.trim() || "+995 555 123 456"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                      {ka ? "ტრანსპორტი" : "Vehicle"}
                    </div>
                    <div className="mt-1 text-base font-bold text-white">
                      {displayVehicle}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                        {ka ? "ფასი" : "Price"}
                      </div>
                      <div className="mt-1 text-lg font-black text-white">
                        {price}₾
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                        {ka ? "ტევადობა" : "Capacity"}
                      </div>
                      <div className="mt-1 text-lg font-black text-white">
                        {capacityTotal}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                        {ka ? "ადგილი" : "Spots"}
                      </div>
                      <div className="mt-1 text-lg font-black text-white">
                        {spotsAvailable}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                      {ka ? "ხელმისაწვდომია" : "Available from"}
                    </div>
                    <div className="mt-1 text-base font-bold text-white">
                      {availableFrom ? new Date(availableFrom).toLocaleString() : "—"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                      {ka ? "შენიშვნა" : "Notes"}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-white/85">
                      {notes.trim() || (ka ? "დამატებითი ინფორმაცია ჯერ არ არის მითითებული." : "No additional information yet.")}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                  {ka
                    ? "რჩევა: WhatsApp ნომერი და მოკლე შენიშვნა უფრო მეტ ზარს მოიტანს."
                    : "Tip: A WhatsApp number and a short note usually bring more calls."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}