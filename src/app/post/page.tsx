"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  { en: "Minivan (with trailer)", ka: "მიქსერი (მისაბმელით)", icon: "🚐" },
  { en: "Other", ka: "სხვა", icon: "🔧" },
];

function normalizePhone(r: string) { return r.replace(/\s+/g, "").trim(); }
function isValidGePhone(p: string) {
  const s = p.replace(/[^\d+]/g, "");
  return s.startsWith("+995") ? /^\+995\d{9}$/.test(s) : /^5\d{8}$/.test(s);
}

function defaultDatetime() {
  const d = new Date(Date.now() + 3 * 36e5);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Step indicator ────────────────────────────────────────────────────────────
function Steps({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {labels.map((label, i) => {
        const active = i + 1 === step;
        const done = i + 1 < step;
        return (
          <div key={i} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black transition-all
                ${done ? "bg-emerald-500 text-white" : active ? "bg-[var(--copart-blue)] text-white shadow-lg shadow-blue-200" : "bg-gray-100 text-gray-400"}`}>
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-xs font-semibold whitespace-nowrap ${active ? "text-[var(--copart-blue)]" : done ? "text-emerald-600" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 mb-4 rounded ${done ? "bg-emerald-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-bold text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PostListingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [lang, setLang] = useState<"en" | "ka">("ka");

  // Redirect to login if not signed in
  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth");
  }, [authLoading, user, router]);
  const ka = lang === "ka";

  const [step, setStep] = useState(1);

  // Step 1 — who are you
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2 — route & vehicle
  const [toCity, setToCity] = useState("Tbilisi");
  const [customCity, setCustomCity] = useState("");
  const [vehicleType, setVehicleType] = useState("Tow truck");

  // Step 3 — details
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
    : ["Who are you", "Route", "Details"];

  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!displayName.trim()) return ka ? "შეიყვანეთ სახელი." : "Enter your name.";
      const p = normalizePhone(phone);
      if (!isValidGePhone(p)) return ka ? "ტელეფონის ფორმატი: +995555123456 ან 555123456" : "Phone format: +995555123456 or 555123456";
    }
    if (s === 2) {
      if (!finalCity) return ka ? "აირჩიეთ ქალაქი." : "Choose a city.";
    }
    if (s === 3) {
      if (price < 0) return ka ? "ფასი 0 ან მეტი." : "Price must be 0+.";
      if (capacityTotal < 1) return ka ? "ტევადობა მინ. 1." : "Capacity min 1.";
      if (spotsAvailable > capacityTotal) return ka ? "ადგილები > ტევადობა." : "Spots exceed capacity.";
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError(null);
    setStep(s => s + 1);
  }

  async function submit() {
    const err = validateStep(3);
    if (err) { setError(err); return; }
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
      setTimeout(() => { router.push("/"); router.refresh(); }, 1800);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : ka ? "შეცდომა." : "Error.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[var(--copart-blue)] focus:bg-white transition";
  const selectCls = inputCls + " cursor-pointer";

  // ── Auth guard screen ─────────────────────────────────────────────────────
  if (authLoading || !user) return (
    <main className="flex min-h-[80vh] items-center justify-center text-gray-400">
      <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </main>
  );

  // ── Success screen ────────────────────────────────────────────────────────
  if (done) return (
    <main className="flex min-h-[80vh] items-center justify-center p-6">
      <div className="text-center">
        <div className="text-6xl">✅</div>
        <div className="mt-4 text-2xl font-black text-gray-900">
          {ka ? "განცხადება გამოქვეყნდა!" : "Listing posted!"}
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {ka ? "გადამისამართება…" : "Redirecting…"}
        </div>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(160deg,#f0f4ff 0%,#f7f8fa 60%,#fff 100%)" }}>
      <div className="mx-auto max-w-xl px-4 py-8">

        {/* top bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-[var(--copart-blue)] hover:underline">
            ← {ka ? "უკან" : "Back"}
          </Link>
          <button onClick={() => setLang(lang === "en" ? "ka" : "en")}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition">
            <img src={lang === "en" ? "https://flagcdn.com/w20/ge.png" : "https://flagcdn.com/w20/gb.png"}
              width={18} height={13} alt="" className="rounded-sm" />
            {lang === "en" ? "ქართული" : "English"}
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          {/* title */}
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900">
              {ka ? "ტრანსპორტის განცხადება" : "Post a transport listing"}
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              {ka ? "პოტიდან ნებისმიერ ქალაქში" : "From Poti to any city in Georgia"}
            </p>
          </div>

          <Steps step={step} labels={stepLabels} />

          {/* ── Step 1: Identity ── */}
          {step === 1 && (
            <div className="grid gap-5">
              <Field label={ka ? "შენი სახელი / სერვისი" : "Your name / service"}>
                <input className={inputCls}
                  placeholder={ka ? "მაგ. გიო ამწის სერვისი" : "e.g. Gio Tow Service"}
                  value={displayName} onChange={e => setDisplayName(e.target.value)} />
              </Field>
              <Field
                label={ka ? "ტელეფონის ნომერი" : "Phone number"}
                hint={ka ? "საჯაროდ გამოჩნდება. WhatsApp-ის ნომერი სჯობს." : "Will be public. WhatsApp number preferred."}>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📞</span>
                  <input className={inputCls + " pl-9"}
                    placeholder="+995 555 123 456"
                    value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </Field>
            </div>
          )}

          {/* ── Step 2: Route & vehicle ── */}
          {step === 2 && (
            <div className="grid gap-5">
              <Field label={ka ? "საიდან" : "From"}>
                <div className={inputCls + " flex items-center gap-2 bg-blue-50 border-blue-200 text-[var(--copart-blue)] font-bold cursor-default"}>
                  📍 {ka ? "პოტი (ფიქსირებული)" : "Poti (fixed)"}
                </div>
              </Field>
              <Field label={ka ? "სად" : "To"}>
                <select className={selectCls} value={toCity} onChange={e => setToCity(e.target.value)}>
                  {CITIES.map(c => <option key={c.en} value={c.en}>{ka ? c.ka : c.en}</option>)}
                </select>
                {toCity === "Other" && (
                  <input className={inputCls + " mt-2"} placeholder={ka ? "ქალაქის სახელი" : "City name"}
                    value={customCity} onChange={e => setCustomCity(e.target.value)} />
                )}
              </Field>
              <Field label={ka ? "სატრანსპორტო საშუალება" : "Vehicle type"}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {VEHICLES.map(v => (
                    <button key={v.en} type="button"
                      onClick={() => setVehicleType(v.en)}
                      className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 text-xs font-bold transition
                        ${vehicleType === v.en
                          ? "border-[var(--copart-blue)] bg-blue-50 text-[var(--copart-blue)]"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}>
                      <span className="text-2xl">{v.icon}</span>
                      {ka ? v.ka : v.en}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* ── Step 3: Details ── */}
          {step === 3 && (
            <div className="grid gap-5">
              <div className="grid grid-cols-3 gap-3">
                <Field label={ka ? "ფასი (₾)" : "Price (₾)"}>
                  <input type="number" className={inputCls} value={price} min={0}
                    onChange={e => setPrice(Number(e.target.value))} />
                </Field>
                <Field label={ka ? "ტევადობა" : "Capacity"}>
                  <input type="number" className={inputCls} value={capacityTotal} min={1}
                    onChange={e => setCapacityTotal(Number(e.target.value))} />
                </Field>
                <Field label={ka ? "ადგილები" : "Spots"}>
                  <input type="number" className={inputCls} value={spotsAvailable} min={0} max={capacityTotal}
                    onChange={e => setSpotsAvailable(Number(e.target.value))} />
                </Field>
              </div>

              <Field label={ka ? "ხელმისაწვდომია" : "Available from"}>
                <input type="datetime-local" className={inputCls} value={availableFrom}
                  onChange={e => setAvailableFrom(e.target.value)} />
              </Field>

              <Field
                label={ka ? "შენიშვნა (არასავალდებულო)" : "Notes (optional)"}
                hint={ka ? "აღების ადგილი, პირობები, სხვა…" : "Pickup spot, conditions, anything useful…"}>
                <textarea className={inputCls} rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder={ka ? "მაგ. პორტის მახლობლად ვარ" : "e.g. I'm near the port"} />
              </Field>

              {/* summary preview */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600 grid gap-1">
                <div className="font-bold text-gray-800 mb-1">
                  {ka ? "შეჯამება" : "Summary"}
                </div>
                <div>🚛 <b>{displayName}</b> · {vehicleType}</div>
                <div>📍 Poti → <b>{finalCity}</b></div>
                <div>💰 <b>{price} ₾</b> · {spotsAvailable}/{capacityTotal} {ka ? "ადგ." : "spots"}</div>
                <div>📞 {phone}</div>
              </div>
            </div>
          )}

          {/* error */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* navigation buttons */}
          <div className="mt-6 flex gap-3">
            {step > 1 && (
              <button type="button" onClick={() => { setError(null); setStep(s => s - 1); }}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
                ← {ka ? "უკან" : "Back"}
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={next}
                className="flex-1 rounded-xl bg-[var(--copart-blue)] py-3 text-sm font-bold text-white hover:opacity-90 transition">
                {ka ? "შემდეგი →" : "Next →"}
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={loading}
                className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50 transition">
                {loading ? (ka ? "იგზავნება…" : "Submitting…") : (ka ? "✓ გამოქვეყნება" : "✓ Publish listing")}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}