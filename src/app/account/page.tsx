"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowRightIcon,
  BoardIcon,
  CalendarIcon,
  CapacityIcon,
  EditIcon,
  LogOutIcon,
  SearchIcon,
  ShieldIcon,
  TrashIcon,
  UserIcon,
  VehicleGlyph,
} from "@/components/site-icons";
import {
  getAccountRole,
  PENDING_ROLE_KEY,
  type MarketplaceRole,
} from "@/lib/account-role";
import { deleteListing, getListingsByUser } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  cityLabel,
  languageFromSearch,
  type Lang,
  vehicleKind,
  vehicleLabel,
} from "@/lib/site-data";
import { supabase } from "@/lib/supabase";
import type { Listing } from "@/lib/types";

const COPY = {
  en: {
    account: "Profile dashboard",
    subtitle: "Manage your access, listings, and marketplace activity.",
    back: "Back to marketplace",
    signOut: "Sign out",
    admin: "Open admin dashboard",
    adminDescription:
      "Track platform data, manage users, and moderate every listing.",
    role: "How you use PotiHaul",
    provider: "Service provider",
    providerDescription: "Publish and manage vehicle transport offers.",
    customer: "Transport customer",
    customerDescription: "Search routes and contact transport providers.",
    roleSaved: "Account role updated.",
    saving: "Saving...",
    welcome: "Your account is ready.",
    providerRequired:
      "Switch to service provider before publishing a transport offer.",
    activeListings: "Active listings",
    expiredListings: "Expired listings",
    availableSpots: "Available spots",
    memberSince: "Member since",
    myListings: "My listings",
    myListingsSub: "Review, update, or remove your transport offers.",
    post: "Post new listing",
    browse: "Browse transport",
    noListings: "You have not posted any transport listings yet.",
    route: "Route",
    available: "Available",
    spots: "spots",
    view: "View",
    edit: "Edit",
    remove: "Remove",
    deleting: "Removing...",
    confirmDelete: "Delete this listing? This cannot be undone.",
    active: "Active",
    expired: "Expired",
    full: "Full",
    loading: "Loading profile...",
    actionError: "Could not complete the action. Please try again.",
  },
  ka: {
    account: "პროფილის მართვა",
    subtitle: "მართე შენი წვდომა, განცხადებები და აქტივობა.",
    back: "მარკეტზე დაბრუნება",
    signOut: "გასვლა",
    admin: "ადმინ პანელის გახსნა",
    adminDescription:
      "აკონტროლე პლატფორმის მონაცემები, მომხმარებლები და ყველა განცხადება.",
    role: "როგორ იყენებ PotiHaul-ს",
    provider: "სერვისის მიმწოდებელი",
    providerDescription: "განათავსე და მართე ავტოტრანსპორტირების შეთავაზებები.",
    customer: "ტრანსპორტის მაძიებელი",
    customerDescription: "მოძებნე მარშრუტები და დაუკავშირდი გადამზიდავს.",
    roleSaved: "ანგარიშის როლი განახლდა.",
    saving: "ინახება...",
    welcome: "შენი ანგარიში მზადაა.",
    providerRequired:
      "განცხადების დასამატებლად აირჩიე სერვისის მიმწოდებლის როლი.",
    activeListings: "აქტიური განცხადებები",
    expiredListings: "ვადაგასული",
    availableSpots: "თავისუფალი ადგილები",
    memberSince: "რეგისტრაციის თარიღი",
    myListings: "ჩემი განცხადებები",
    myListingsSub: "ნახე, განაახლე ან წაშალე შენი შეთავაზებები.",
    post: "ახალი განცხადება",
    browse: "ტრანსპორტის მოძებნა",
    noListings: "ჯერ არცერთი სატრანსპორტო განცხადება არ დაგიმატებია.",
    route: "მარშრუტი",
    available: "ხელმისაწვდომია",
    spots: "ადგილი",
    view: "ნახვა",
    edit: "რედაქტირება",
    remove: "წაშლა",
    deleting: "იშლება...",
    confirmDelete: "წავშალოთ ეს განცხადება? მოქმედება შეუქცევადია.",
    active: "აქტიური",
    expired: "ვადაგასული",
    full: "შევსებული",
    loading: "პროფილი იტვირთება...",
    actionError: "მოქმედება ვერ შესრულდა. სცადე ხელახლა.",
  },
} as const;

function formatDate(value: string, lang: Lang) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(lang === "ka" ? "ka-GE" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function DashboardStat({
  icon,
  value,
  label,
  tone = "sky",
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  tone?: "sky" | "orange" | "emerald" | "slate";
}) {
  const tones = {
    sky: "bg-sky-100 text-sky-700",
    orange: "bg-orange-100 text-orange-700",
    emerald: "bg-emerald-100 text-emerald-700",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_38px_rgba(2,74,122,0.07)]">
      <div className="flex items-center justify-between gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone]}`}>
          {icon}
        </span>
        <span className="text-2xl font-black text-slate-950">{value}</span>
      </div>
      <div className="mt-3 text-xs font-bold text-slate-500">{label}</div>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [lang, setLang] = useState<Lang>(() =>
    typeof window === "undefined" ? "ka" : languageFromSearch(window.location.search)
  );
  const [role, setRole] = useState(() => getAccountRole(user, profile));
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const t = COPY[lang];

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/auth?lang=${lang}`);
    }
  }, [authLoading, lang, router, user]);

  useEffect(() => {
    setRole(getAccountRole(user, profile));
  }, [profile, user]);

  useEffect(() => {
    if (!user) return;

    setLoadingListings(true);
    void getListingsByUser(user.id)
      .then(setListings)
      .finally(() => setLoadingListings(false));

    const pendingRole = localStorage.getItem(PENDING_ROLE_KEY);
    if (pendingRole === "provider" || pendingRole === "customer") {
      localStorage.removeItem(PENDING_ROLE_KEY);
      void saveRole(pendingRole, true);
    }
    // Persist a role selected immediately before OAuth completes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const analytics = useMemo(() => {
    const active = listings.filter(
      (listing) => new Date(listing.available_from).getTime() >= now - 36e5
    );
    const expired = listings.length - active.length;
    const spots = active.reduce(
      (total, listing) => total + listing.spots_available,
      0
    );
    return { active: active.length, expired, spots };
  }, [listings, now]);

  async function saveRole(nextRole: MarketplaceRole, welcoming = false) {
    if (!user || role === "admin") return;

    setSaving(true);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({
      data: { marketplace_role: nextRole },
    });

    if (!error) {
      setRole(nextRole);
      setMessage(welcoming ? t.welcome : t.roleSaved);
      if (nextRole === "provider") {
        await supabase
          .from("profiles")
          .update({ role: "driver" })
          .eq("id", user.id);
      }
    } else {
      setMessage(error.message);
    }
    setSaving(false);
  }

  async function removeListing(listing: Listing) {
    if (!confirm(t.confirmDelete)) return;
    setDeletingId(listing.id);
    setMessage(null);

    try {
      await deleteListing(listing.id);
      setListings((current) =>
        current.filter((item) => item.id !== listing.id)
      );
    } catch {
      setMessage(t.actionError);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push(`/?lang=${lang}`);
  }

  function toggleLanguage() {
    const next = lang === "ka" ? "en" : "ka";
    setLang(next);
    router.replace(`/account?lang=${next}`, { scroll: false });
  }

  if (authLoading || !user) {
    return (
      <main
        lang={lang}
        className="flex min-h-[80vh] items-center justify-center text-slate-500"
      >
        <div className="rounded-[24px] border border-white/80 bg-white/90 px-5 py-4 shadow-[0_16px_44px_rgba(2,74,122,0.09)]">
          {t.loading}
        </div>
      </main>
    );
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "PotiHaul";
  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const initial = displayName.slice(0, 1).toUpperCase();
  const providerNotice =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("notice") === "provider";

  return (
    <main lang={lang} className="min-h-screen pb-16">
      <header className="border-b border-white/70 bg-[rgba(248,251,255,0.86)] backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href={`/?lang=${lang}`}>
            <img src="/logo.png" alt="PotiHaul" className="h-12 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2">
            {role === "admin" && (
              <Link
                href={`/admin?lang=${lang}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(249,115,22,0.22)] transition hover:from-orange-400 hover:to-orange-500"
              >
                <ShieldIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.admin}</span>
              </Link>
            )}
            <button
              onClick={toggleLanguage}
              className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-sky-300"
            >
              {lang === "ka" ? "EN" : "KA"}
            </button>
            <button
              onClick={() => void handleSignOut()}
              aria-label={t.signOut}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOutIcon className="h-4 w-4" />
              <span className="hidden md:inline">{t.signOut}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <Link
          href={`/?lang=${lang}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-sky-700"
        >
          <ArrowRightIcon className="h-4 w-4 rotate-180" />
          {t.back}
        </Link>

        <section className="mt-5 overflow-hidden rounded-[36px] border border-white/80 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.2),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.18),transparent_34%),linear-gradient(145deg,#ffffff_0%,#f0f9ff_58%,#fff7ed_100%)] p-6 shadow-[0_26px_80px_rgba(2,74,122,0.12)] sm:p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
              {avatar ? (
                <img
                  src={avatar}
                  alt=""
                  className="h-24 w-24 shrink-0 rounded-[30px] border-4 border-white object-cover shadow-[0_16px_38px_rgba(2,74,122,0.14)]"
                />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[30px] bg-gradient-to-br from-sky-600 to-blue-700 text-4xl font-black text-white shadow-[0_18px_44px_rgba(2,132,199,0.24)]">
                  {initial}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-sm font-bold text-sky-700">{t.account}</div>
                <h1 className="mt-1 truncate text-3xl font-black text-slate-950 sm:text-4xl">
                  {displayName}
                </h1>
                <p className="mt-1 truncate text-sm text-slate-500">{user.email}</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-700">
                  {role === "admin" ? (
                    <ShieldIcon className="h-3.5 w-3.5 text-orange-600" />
                  ) : role === "provider" ? (
                    <VehicleGlyph kind="carrier" className="h-4 w-4 text-sky-700" />
                  ) : (
                    <SearchIcon className="h-3.5 w-3.5 text-sky-700" />
                  )}
                  {role === "admin"
                    ? t.admin
                    : role === "provider"
                      ? t.provider
                      : t.customer}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {role === "admin" && (
                <Link
                  href={`/admin?lang=${lang}`}
                  className="inline-flex items-center gap-2 rounded-[22px] bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(249,115,22,0.22)]"
                >
                  <ShieldIcon className="h-4 w-4" />
                  {t.admin}
                </Link>
              )}
              {role === "provider" || role === "admin" ? (
                <Link
                  href={`/post?lang=${lang}`}
                  className="inline-flex items-center gap-2 rounded-[22px] bg-gradient-to-r from-sky-600 to-blue-700 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(2,132,199,0.22)]"
                >
                  <VehicleGlyph kind="tow" className="h-5 w-5" />
                  {t.post}
                </Link>
              ) : (
                <Link
                  href={`/?lang=${lang}`}
                  className="inline-flex items-center gap-2 rounded-[22px] bg-gradient-to-r from-sky-600 to-blue-700 px-5 py-3 text-sm font-bold text-white"
                >
                  <SearchIcon className="h-4 w-4" />
                  {t.browse}
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStat
            icon={<BoardIcon className="h-5 w-5" />}
            value={analytics.active}
            label={t.activeListings}
            tone="emerald"
          />
          <DashboardStat
            icon={<CalendarIcon className="h-5 w-5" />}
            value={analytics.expired}
            label={t.expiredListings}
            tone="orange"
          />
          <DashboardStat
            icon={<CapacityIcon className="h-5 w-5" />}
            value={analytics.spots}
            label={t.availableSpots}
          />
          <DashboardStat
            icon={<UserIcon className="h-5 w-5" />}
            value={formatDate(user.created_at, lang)}
            label={t.memberSince}
            tone="slate"
          />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-[0_18px_55px_rgba(2,74,122,0.08)]">
            <h2 className="text-xl font-black text-slate-950">{t.role}</h2>
            <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>

            {role === "admin" ? (
              <div className="mt-5 rounded-[26px] border border-orange-200 bg-orange-50 p-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white">
                    <ShieldIcon className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="font-bold text-slate-900">{t.admin}</div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {t.adminDescription}
                    </p>
                    <Link
                      href={`/admin?lang=${lang}`}
                      className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-4 py-2 text-sm font-bold text-white"
                    >
                      {t.admin}
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                <RoleButton
                  active={role === "provider"}
                  title={t.provider}
                  description={t.providerDescription}
                  icon={<VehicleGlyph kind="carrier" className="h-7 w-7" />}
                  disabled={saving}
                  onClick={() => void saveRole("provider")}
                />
                <RoleButton
                  active={role === "customer"}
                  title={t.customer}
                  description={t.customerDescription}
                  icon={<SearchIcon className="h-6 w-6" />}
                  disabled={saving}
                  onClick={() => void saveRole("customer")}
                />
              </div>
            )}

            {(message || providerNotice) && (
              <div className="mt-4 rounded-[22px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
                {saving
                  ? t.saving
                  : providerNotice
                    ? t.providerRequired
                    : message}
              </div>
            )}
          </div>

          <div className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-[0_18px_55px_rgba(2,74,122,0.08)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">{t.myListings}</h2>
                <p className="mt-1 text-sm text-slate-500">{t.myListingsSub}</p>
              </div>
              {(role === "provider" || role === "admin") && (
                <Link
                  href={`/post?lang=${lang}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700 transition hover:bg-sky-100"
                >
                  <VehicleGlyph kind="tow" className="h-5 w-5" />
                  {t.post}
                </Link>
              )}
            </div>

            {loadingListings ? (
              <div className="py-14 text-center text-sm text-slate-400">
                {t.loading}
              </div>
            ) : listings.length === 0 ? (
              <div className="mt-5 rounded-[26px] border border-dashed border-slate-300 bg-slate-50/70 px-5 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <BoardIcon className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-500">
                  {t.noListings}
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                {listings.map((listing) => {
                  const expired =
                    new Date(listing.available_from).getTime() < now - 36e5;
                  const full = !expired && listing.spots_available === 0;
                  const kind = vehicleKind(listing.vehicle_type);

                  return (
                    <article
                      key={listing.id}
                      className="rounded-[26px] border border-slate-200 bg-slate-50/65 p-4 transition hover:border-sky-200 hover:bg-sky-50/50"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 text-white">
                          <VehicleGlyph kind={kind} className="h-8 w-8" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-lg font-black text-slate-900">
                              {cityLabel(listing.from_city, lang)}
                              <span className="mx-2 text-orange-500">→</span>
                              {cityLabel(listing.to_city, lang)}
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                expired
                                  ? "bg-slate-200 text-slate-600"
                                  : full
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {expired ? t.expired : full ? t.full : t.active}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>{vehicleLabel(listing.vehicle_type, lang)}</span>
                            <span>
                              {t.available}: {formatDate(listing.available_from, lang)}
                            </span>
                            <span>
                              {listing.spots_available}/{listing.capacity_total} {t.spots}
                            </span>
                            <span className="font-bold text-slate-700">
                              {listing.price_gel}₾
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/listing/${listing.id}?lang=${lang}`}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-sky-300 hover:text-sky-700"
                          >
                            {t.view}
                          </Link>
                          <Link
                            href={`/listing/${listing.id}/edit?lang=${lang}`}
                            className="inline-flex items-center gap-1 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
                          >
                            <EditIcon className="h-3.5 w-3.5" />
                            {t.edit}
                          </Link>
                          <button
                            onClick={() => void removeListing(listing)}
                            disabled={deletingId === listing.id}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            {deletingId === listing.id ? t.deleting : t.remove}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function RoleButton({
  active,
  title,
  description,
  icon,
  disabled,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  icon: ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-start gap-4 rounded-[26px] border p-5 text-left transition disabled:opacity-60 ${
        active
          ? "border-sky-400 bg-sky-50 ring-4 ring-sky-100"
          : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/50"
      }`}
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
          active
            ? "bg-gradient-to-br from-sky-600 to-blue-700 text-white"
            : "bg-sky-50 text-sky-700"
        }`}
      >
        {icon}
      </span>
      <span>
        <span className="block text-sm font-bold text-slate-900">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </button>
  );
}
