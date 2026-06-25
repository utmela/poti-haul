"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { StylizedDropdown } from "@/components/stylized-dropdown";
import {
  ArrowRightIcon,
  BoardIcon,
  CalendarIcon,
  CapacityIcon,
  ClockIcon,
  EditIcon,
  RefreshIcon,
  RouteIcon,
  SearchIcon,
  ShieldIcon,
  TrashIcon,
  TrendIcon,
  UsersIcon,
  VehicleGlyph,
} from "@/components/site-icons";
import { deleteListing, getAllListings } from "@/lib/api";
import { getAccountRole } from "@/lib/account-role";
import { useAuth } from "@/lib/auth-context";
import {
  cityLabel,
  languageFromSearch,
  type Lang,
  vehicleLabel,
} from "@/lib/site-data";
import { supabase } from "@/lib/supabase";
import type { Listing, Profile } from "@/lib/types";

type AdminTab = "overview" | "listings" | "users";
type ListingStatus = "all" | "active" | "expired" | "full";
type ListingSort = "newest" | "available" | "priceHigh" | "priceLow";

const COPY = {
  en: {
    admin: "Operations dashboard",
    subtitle: "Track marketplace health, moderate listings, and manage access.",
    marketplace: "Back to marketplace",
    overview: "Overview",
    listings: "Listings",
    users: "Users",
    totalPosts: "All posts",
    activePosts: "Active posts",
    expiredPosts: "Expired posts",
    registeredUsers: "Registered users",
    availableSpots: "Available spots",
    averagePrice: "Average price",
    utilization: "Capacity used",
    addedWeek: "Added in 7 days",
    activity: "Publishing activity",
    activitySub: "New listings over the last seven days",
    topRoutes: "Most active routes",
    topRoutesSub: "Routes with the highest number of listings",
    operations: "Operational snapshot",
    fullPosts: "Fully booked",
    providers: "Provider profiles",
    admins: "Administrators",
    search: "Search city, provider, phone, or vehicle",
    status: "Status",
    sort: "Sort",
    all: "All listings",
    active: "Active",
    expired: "Expired",
    full: "Full",
    newest: "Newest first",
    available: "Departure time",
    priceHigh: "Highest price",
    priceLow: "Lowest price",
    refresh: "Refresh data",
    removeExpired: "Remove expired",
    confirmExpired: "Delete all expired listings? This cannot be undone.",
    confirmDelete: "Delete this listing? This cannot be undone.",
    route: "Route",
    provider: "Provider",
    price: "Price",
    seats: "Availability",
    departure: "Departure",
    posted: "Posted",
    actions: "Actions",
    view: "View",
    edit: "Edit",
    remove: "Remove",
    noListings: "No listings match these filters.",
    showing: "Showing",
    of: "of",
    userId: "User ID",
    role: "Access role",
    joined: "Joined",
    adminRole: "Admin",
    driverRole: "Provider",
    promote: "Make admin",
    demote: "Make provider",
    confirmRole: "Change this user's access role?",
    loading: "Loading dashboard...",
    deleted: "Listing removed.",
    bulkDeleted: "Expired listings removed.",
    roleUpdated: "Access role updated.",
    dataError: "Could not complete the action. Please try again.",
  },
  ka: {
    admin: "მართვის პანელი",
    subtitle:
      "აკონტროლე პლატფორმის მდგომარეობა, განცხადებები და მომხმარებლების წვდომა.",
    marketplace: "მარკეტზე დაბრუნება",
    overview: "მიმოხილვა",
    listings: "განცხადებები",
    users: "მომხმარებლები",
    totalPosts: "ყველა განცხადება",
    activePosts: "აქტიური განცხადებები",
    expiredPosts: "ვადაგასული",
    registeredUsers: "რეგისტრირებული მომხმარებლები",
    availableSpots: "თავისუფალი ადგილები",
    averagePrice: "საშუალო ფასი",
    utilization: "შევსებული ტევადობა",
    addedWeek: "დამატებულია 7 დღეში",
    activity: "განთავსების აქტივობა",
    activitySub: "ბოლო შვიდ დღეში დამატებული განცხადებები",
    topRoutes: "ყველაზე აქტიური მარშრუტები",
    topRoutesSub: "მარშრუტები განცხადებების ყველაზე დიდი რაოდენობით",
    operations: "ოპერაციული სურათი",
    fullPosts: "სრულად შევსებული",
    providers: "სერვისის მიმწოდებლები",
    admins: "ადმინისტრატორები",
    search: "ქალაქი, გადამზიდავი, ნომერი ან ტრანსპორტი",
    status: "სტატუსი",
    sort: "დალაგება",
    all: "ყველა განცხადება",
    active: "აქტიური",
    expired: "ვადაგასული",
    full: "შევსებული",
    newest: "ჯერ ახალი",
    available: "გასვლის დრო",
    priceHigh: "ჯერ მაღალი ფასი",
    priceLow: "ჯერ დაბალი ფასი",
    refresh: "მონაცემების განახლება",
    removeExpired: "ვადაგასულების წაშლა",
    confirmExpired: "წავშალოთ ყველა ვადაგასული განცხადება? მოქმედება შეუქცევადია.",
    confirmDelete: "წავშალოთ ეს განცხადება? მოქმედება შეუქცევადია.",
    route: "მარშრუტი",
    provider: "გადამზიდავი",
    price: "ფასი",
    seats: "ადგილები",
    departure: "გასვლის დრო",
    posted: "დამატებულია",
    actions: "მოქმედებები",
    view: "ნახვა",
    edit: "რედაქტირება",
    remove: "წაშლა",
    noListings: "ამ ფილტრებით განცხადებები ვერ მოიძებნა.",
    showing: "ნაჩვენებია",
    of: "-დან",
    userId: "მომხმარებლის ID",
    role: "წვდომის როლი",
    joined: "რეგისტრაცია",
    adminRole: "ადმინისტრატორი",
    driverRole: "მიმწოდებელი",
    promote: "ადმინისტრატორად დანიშვნა",
    demote: "მიმწოდებლად შეცვლა",
    confirmRole: "შევცვალოთ ამ მომხმარებლის წვდომის როლი?",
    loading: "პანელი იტვირთება...",
    deleted: "განცხადება წაიშალა.",
    bulkDeleted: "ვადაგასული განცხადებები წაიშალა.",
    roleUpdated: "წვდომის როლი განახლდა.",
    dataError: "მოქმედება ვერ შესრულდა. სცადე ხელახლა.",
  },
} as const;

function formatDate(value: string, lang: Lang) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(lang === "ka" ? "ka-GE" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function isListingExpired(listing: Listing, now: number) {
  return new Date(listing.available_from).getTime() < now - 36e5;
}

function MetricCard({
  icon,
  label,
  value,
  tone = "sky",
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone?: "sky" | "orange" | "emerald" | "slate";
}) {
  const tones = {
    sky: "bg-sky-100 text-sky-700",
    orange: "bg-orange-100 text-orange-700",
    emerald: "bg-emerald-100 text-emerald-700",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_16px_44px_rgba(2,74,122,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}>
          {icon}
        </div>
        <div className="text-right">
          <div className="text-3xl font-black tracking-tight text-slate-950">
            {value}
          </div>
          <div className="mt-1 text-xs font-bold text-slate-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [lang, setLang] = useState<Lang>(() =>
    typeof window === "undefined" ? "ka" : languageFromSearch(window.location.search)
  );
  const [now] = useState(() => Date.now());
  const [tab, setTab] = useState<AdminTab>("overview");
  const [listings, setListings] = useState<Listing[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ListingStatus>("all");
  const [sort, setSort] = useState<ListingSort>("newest");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const t = COPY[lang];
  const accountRole = getAccountRole(user, profile);

  useEffect(() => {
    if (!authLoading && (!user || accountRole !== "admin")) {
      router.replace(`/?lang=${lang}`);
    }
  }, [accountRole, authLoading, lang, router, user]);

  useEffect(() => {
    if (accountRole === "admin") {
      void loadDashboard();
    }
  }, [accountRole]);

  async function loadDashboard() {
    setLoading(true);
    setNotice(null);

    const [allListings, profileResult] = await Promise.all([
      getAllListings(),
      supabase.from("profiles").select("id,role,created_at").order("created_at", {
        ascending: false,
      }),
    ]);

    setListings(allListings);
    setProfiles((profileResult.data ?? []) as Profile[]);
    setLoading(false);
  }

  const analytics = useMemo(() => {
    const active = listings.filter(
      (listing) => !isListingExpired(listing, now)
    );
    const expiredListings = listings.filter((listing) =>
      isListingExpired(listing, now)
    );
    const totalCapacity = active.reduce(
      (sum, listing) => sum + listing.capacity_total,
      0
    );
    const availableSpots = active.reduce(
      (sum, listing) => sum + listing.spots_available,
      0
    );
    const usedCapacity = Math.max(0, totalCapacity - availableSpots);
    const utilization =
      totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0;
    const averagePrice =
      active.length > 0
        ? Math.round(
            active.reduce((sum, listing) => sum + listing.price_gel, 0) /
              active.length
          )
        : 0;
    const weekStart = now - 7 * 24 * 36e5;
    const addedWeek = listings.filter(
      (listing) => new Date(listing.created_at).getTime() >= weekStart
    ).length;
    const full = active.filter((listing) => listing.spots_available === 0).length;

    const routeCounts = new Map<string, number>();
    listings.forEach((listing) => {
      const key = `${listing.from_city}|||${listing.to_city}`;
      routeCounts.set(key, (routeCounts.get(key) ?? 0) + 1);
    });
    const topRoutes = [...routeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now - (6 - index) * 24 * 36e5);
      const start = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ).getTime();
      const end = start + 24 * 36e5;
      const count = listings.filter((listing) => {
        const created = new Date(listing.created_at).getTime();
        return created >= start && created < end;
      }).length;

      return {
        label: date.toLocaleDateString(lang === "ka" ? "ka-GE" : "en-US", {
          weekday: "short",
        }),
        count,
      };
    });

    return {
      active,
      expiredListings,
      totalCapacity,
      availableSpots,
      utilization,
      averagePrice,
      addedWeek,
      full,
      topRoutes,
      days,
    };
  }, [lang, listings, now]);

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return listings
      .filter((listing) => {
        const isExpired = isListingExpired(listing, now);
        const matchesStatus =
          status === "all" ||
          (status === "active" && !isExpired) ||
          (status === "expired" && isExpired) ||
          (status === "full" && !isExpired && listing.spots_available === 0);
        const matchesSearch =
          !query ||
          [
            listing.from_city,
            listing.to_city,
            listing.driver_display_name,
            listing.driver_phone,
            listing.vehicle_type,
          ].some((value) => value.toLowerCase().includes(query));

        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (sort === "priceHigh") return b.price_gel - a.price_gel;
        if (sort === "priceLow") return a.price_gel - b.price_gel;
        if (sort === "available") {
          return (
            new Date(a.available_from).getTime() -
            new Date(b.available_from).getTime()
          );
        }
        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      });
  }, [listings, now, search, status, sort]);

  async function removeListing(id: string) {
    if (!confirm(t.confirmDelete)) return;
    setDeletingId(id);
    setNotice(null);

    try {
      await deleteListing(id);
      setListings((current) => current.filter((listing) => listing.id !== id));
      setNotice(t.deleted);
    } catch {
      setNotice(t.dataError);
    } finally {
      setDeletingId(null);
    }
  }

  async function removeExpired() {
    if (!confirm(t.confirmExpired)) return;
    setBulkDeleting(true);
    setNotice(null);

    const ids = analytics.expiredListings.map((listing) => listing.id);
    if (ids.length === 0) {
      setBulkDeleting(false);
      return;
    }

    const { error } = await supabase.from("listings").delete().in("id", ids);
    if (error) {
      setNotice(t.dataError);
    } else {
      setListings((current) => current.filter((listing) => !ids.includes(listing.id)));
      setNotice(t.bulkDeleted);
    }
    setBulkDeleting(false);
  }

  async function changeRole(target: Profile) {
    if (target.id === user?.id || !confirm(t.confirmRole)) return;
    const nextRole = target.role === "admin" ? "driver" : "admin";
    setUpdatingUserId(target.id);
    setNotice(null);

    const { error } = await supabase
      .from("profiles")
      .update({ role: nextRole })
      .eq("id", target.id);

    if (error) {
      setNotice(t.dataError);
    } else {
      setProfiles((current) =>
        current.map((item) =>
          item.id === target.id ? { ...item, role: nextRole } : item
        )
      );
      setNotice(t.roleUpdated);
    }
    setUpdatingUserId(null);
  }

  function toggleLanguage() {
    const next = lang === "ka" ? "en" : "ka";
    setLang(next);
    router.replace(`/admin?lang=${next}`, { scroll: false });
  }

  if (authLoading || !user || accountRole !== "admin") {
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

  const maxActivity = Math.max(1, ...analytics.days.map((day) => day.count));
  const providerCount = profiles.filter((item) => item.role === "driver").length;
  const adminCount = profiles.filter((item) => item.role === "admin").length;

  const statusOptions = [
    { value: "all", label: t.all },
    { value: "active", label: t.active },
    { value: "expired", label: t.expired },
    { value: "full", label: t.full },
  ];
  const sortOptions = [
    { value: "newest", label: t.newest },
    { value: "available", label: t.available },
    { value: "priceHigh", label: t.priceHigh },
    { value: "priceLow", label: t.priceLow },
  ];

  return (
    <main lang={lang} className="min-h-screen pb-16">
      <header className="sticky top-0 z-50 border-b border-white/70 bg-[rgba(248,251,255,0.86)] backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href={`/?lang=${lang}`} className="shrink-0">
            <img src="/logo.png" alt="PotiHaul" className="h-12 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/?lang=${lang}`}
              className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-sky-300 hover:text-sky-700 sm:inline-flex"
            >
              <ArrowRightIcon className="h-4 w-4 rotate-180" />
              {t.marketplace}
            </Link>
            <button
              onClick={toggleLanguage}
              className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-sky-300"
            >
              {lang === "ka" ? "EN" : "KA"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 pt-8 sm:px-6">
        <section className="overflow-hidden rounded-[36px] border border-white/80 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.2),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.18),transparent_34%),linear-gradient(135deg,#ffffff_0%,#f0f9ff_58%,#fff7ed_100%)] p-6 shadow-[0_24px_80px_rgba(2,74,122,0.11)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold text-orange-700">
                <ShieldIcon className="h-3.5 w-3.5" />
                PotiHaul Admin
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {t.admin}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                {t.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["overview", "listings", "users"] as AdminTab[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
                    tab === item
                      ? "bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-[0_10px_28px_rgba(2,132,199,0.22)]"
                      : "border border-slate-200 bg-white/80 text-slate-600 hover:border-sky-300 hover:text-sky-700"
                  }`}
                >
                  {t[item]}
                </button>
              ))}
            </div>
          </div>
        </section>

        {notice && (
          <div className="mt-5 rounded-[22px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-800">
            {notice}
          </div>
        )}

        {tab === "overview" && (
          <div className="mt-5 grid gap-5">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={<BoardIcon className="h-5 w-5" />}
                label={t.totalPosts}
                value={listings.length}
              />
              <MetricCard
                icon={<TrendIcon className="h-5 w-5" />}
                label={t.activePosts}
                value={analytics.active.length}
                tone="emerald"
              />
              <MetricCard
                icon={<ClockIcon className="h-5 w-5" />}
                label={t.expiredPosts}
                value={analytics.expiredListings.length}
                tone="orange"
              />
              <MetricCard
                icon={<UsersIcon className="h-5 w-5" />}
                label={t.registeredUsers}
                value={profiles.length}
                tone="slate"
              />
              <MetricCard
                icon={<CapacityIcon className="h-5 w-5" />}
                label={t.availableSpots}
                value={analytics.availableSpots}
              />
              <MetricCard
                icon={<RouteIcon className="h-5 w-5" />}
                label={t.averagePrice}
                value={`${analytics.averagePrice}₾`}
                tone="orange"
              />
              <MetricCard
                icon={<TrendIcon className="h-5 w-5" />}
                label={t.utilization}
                value={`${analytics.utilization}%`}
                tone="emerald"
              />
              <MetricCard
                icon={<CalendarIcon className="h-5 w-5" />}
                label={t.addedWeek}
                value={analytics.addedWeek}
                tone="slate"
              />
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-[0_18px_55px_rgba(2,74,122,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">{t.activity}</h2>
                    <p className="mt-1 text-sm text-slate-500">{t.activitySub}</p>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                    <TrendIcon className="h-5 w-5" />
                  </span>
                </div>

                <div className="mt-8 grid h-52 grid-cols-7 items-end gap-2 sm:gap-4">
                  {analytics.days.map((day) => (
                    <div key={day.label} className="flex h-full flex-col justify-end">
                      <div className="mb-2 text-center text-xs font-black text-slate-700">
                        {day.count}
                      </div>
                      <div
                        className="min-h-2 rounded-t-2xl bg-gradient-to-t from-blue-700 to-sky-400 shadow-[0_8px_22px_rgba(2,132,199,0.16)]"
                        style={{ height: `${Math.max(5, (day.count / maxActivity) * 100)}%` }}
                      />
                      <div className="mt-3 text-center text-[11px] font-bold text-slate-400">
                        {day.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-[0_18px_55px_rgba(2,74,122,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">{t.topRoutes}</h2>
                    <p className="mt-1 text-sm text-slate-500">{t.topRoutesSub}</p>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                    <RouteIcon className="h-5 w-5" />
                  </span>
                </div>

                <div className="mt-5 grid gap-3">
                  {analytics.topRoutes.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-400">
                      {t.noListings}
                    </p>
                  ) : (
                    analytics.topRoutes.map(([route, count], index) => {
                      const [from, to] = route.split("|||");
                      return (
                        <div
                          key={route}
                          className="flex items-center gap-3 rounded-[22px] border border-slate-100 bg-slate-50/80 p-3"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-black text-sky-700">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">
                            {cityLabel(from, lang)}
                            <span className="mx-2 text-orange-500">→</span>
                            {cityLabel(to, lang)}
                          </div>
                          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">
                            {count}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-[0_18px_55px_rgba(2,74,122,0.08)]">
              <h2 className="text-xl font-black text-slate-950">{t.operations}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <MetricCard
                  icon={<CapacityIcon className="h-5 w-5" />}
                  label={t.fullPosts}
                  value={analytics.full}
                  tone="orange"
                />
                <MetricCard
                  icon={<VehicleGlyph kind="carrier" className="h-6 w-6" />}
                  label={t.providers}
                  value={providerCount}
                />
                <MetricCard
                  icon={<ShieldIcon className="h-5 w-5" />}
                  label={t.admins}
                  value={adminCount}
                  tone="slate"
                />
              </div>
            </section>
          </div>
        )}

        {tab === "listings" && (
          <section className="mt-5 rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-[0_18px_55px_rgba(2,74,122,0.08)] sm:p-6">
            <div className="grid gap-3 xl:grid-cols-[1fr_220px_220px_auto_auto]">
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t.search}
                  className="h-14 w-full rounded-[24px] border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                />
              </div>
              <StylizedDropdown
                value={status}
                onChange={(value) => setStatus(value as ListingStatus)}
                options={statusOptions}
                placeholder={t.status}
                buttonIcon={<BoardIcon className="h-4 w-4" />}
              />
              <StylizedDropdown
                value={sort}
                onChange={(value) => setSort(value as ListingSort)}
                options={sortOptions}
                placeholder={t.sort}
                buttonIcon={<TrendIcon className="h-4 w-4" />}
              />
              <button
                onClick={() => void loadDashboard()}
                disabled={loading}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-[24px] border border-sky-200 bg-sky-50 px-4 text-sm font-bold text-sky-700 transition hover:bg-sky-100 disabled:opacity-50"
              >
                <RefreshIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                {t.refresh}
              </button>
              <button
                onClick={() => void removeExpired()}
                disabled={bulkDeleting || analytics.expiredListings.length === 0}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-[24px] border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-40"
              >
                <TrashIcon className="h-4 w-4" />
                {t.removeExpired} ({analytics.expiredListings.length})
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-sky-50/80 text-xs text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-bold">{t.route}</th>
                      <th className="px-4 py-3 font-bold">{t.provider}</th>
                      <th className="px-4 py-3 font-bold">{t.price}</th>
                      <th className="px-4 py-3 font-bold">{t.seats}</th>
                      <th className="px-4 py-3 font-bold">{t.departure}</th>
                      <th className="px-4 py-3 font-bold">{t.posted}</th>
                      <th className="px-4 py-3 font-bold">{t.status}</th>
                      <th className="px-4 py-3 font-bold">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredListings.map((listing) => {
                      const isExpired = isListingExpired(listing, now);
                      const isFull = !isExpired && listing.spots_available === 0;
                      return (
                        <tr
                          key={listing.id}
                          className="border-t border-slate-100 bg-white transition hover:bg-sky-50/40"
                        >
                          <td className="px-4 py-4 font-bold text-slate-900">
                            {cityLabel(listing.from_city, lang)}
                            <span className="mx-2 text-orange-500">→</span>
                            {cityLabel(listing.to_city, lang)}
                            <div className="mt-1 text-xs font-medium text-slate-400">
                              {vehicleLabel(listing.vehicle_type, lang)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-bold text-slate-800">
                              {listing.driver_display_name}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {listing.driver_phone}
                            </div>
                          </td>
                          <td className="px-4 py-4 font-black text-slate-900">
                            {listing.price_gel}₾
                          </td>
                          <td className="px-4 py-4 font-semibold text-slate-600">
                            {listing.spots_available}/{listing.capacity_total}
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-600">
                            {formatDate(listing.available_from, lang)}
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-500">
                            {formatDate(listing.created_at, lang)}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                isExpired
                                  ? "bg-slate-100 text-slate-500"
                                  : isFull
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {isExpired ? t.expired : isFull ? t.full : t.active}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
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
                                onClick={() => void removeListing(listing.id)}
                                disabled={deletingId === listing.id}
                                aria-label={`${t.remove}: ${listing.driver_display_name}`}
                                className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                                {deletingId === listing.id ? "..." : t.remove}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredListings.length === 0 && (
                <div className="bg-white px-4 py-16 text-center text-sm text-slate-400">
                  {t.noListings}
                </div>
              )}
              <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-xs font-semibold text-slate-500">
                {t.showing} {filteredListings.length} {t.of} {listings.length}
              </div>
            </div>
          </section>
        )}

        {tab === "users" && (
          <section className="mt-5 rounded-[32px] border border-white/80 bg-white/90 p-5 shadow-[0_18px_55px_rgba(2,74,122,0.08)] sm:p-6">
            <div className="overflow-hidden rounded-[26px] border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-sky-50/80 text-xs text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-bold">{t.userId}</th>
                      <th className="px-4 py-3 font-bold">{t.role}</th>
                      <th className="px-4 py-3 font-bold">{t.joined}</th>
                      <th className="px-4 py-3 font-bold">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((item) => {
                      const isAdmin = item.role === "admin";
                      const isCurrentUser = item.id === user.id;
                      return (
                        <tr key={item.id} className="border-t border-slate-100">
                          <td className="px-4 py-4 font-mono text-xs text-slate-500">
                            {item.id}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                isAdmin
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-sky-100 text-sky-700"
                              }`}
                            >
                              {isAdmin ? t.adminRole : t.driverRole}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-500">
                            {formatDate(item.created_at, lang)}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => void changeRole(item)}
                              disabled={isCurrentUser || updatingUserId === item.id}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {updatingUserId === item.id
                                ? "..."
                                : isAdmin
                                  ? t.demote
                                  : t.promote}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
