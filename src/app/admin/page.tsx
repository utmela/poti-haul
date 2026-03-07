"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getListings, deleteListing } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Listing } from "@/lib/types";

type SortKey = "available_from" | "price_gel" | "created_at";

function formatDate(ts: string) {
  const d = new Date(ts);
  return isNaN(d.getTime()) ? ts : d.toLocaleString();
}

function isExpired(ts: string) {
  return new Date(ts).getTime() < Date.now() - 36e5;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteAllExpiredLoading, setDeleteAllExpiredLoading] = useState(false);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [tab, setTab] = useState<"listings" | "users">("listings");

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== "admin")) {
      router.replace("/");
    }
  }, [authLoading, user, profile, router]);

  useEffect(() => {
    if (profile?.role === "admin") {
      load();
      loadUserCount();
    }
  }, [profile]);

  async function load() {
    setLoading(true);
    const data = await getListings();
    setListings(data);
    setLoading(false);
  }

  async function loadUserCount() {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    setUserCount(count ?? 0);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this listing?")) return;
    setDeletingId(id);
    try {
      await deleteListing(id);
      setListings(prev => prev.filter(l => l.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteAllExpired() {
    if (!confirm("Delete ALL expired listings (older than 48h)?")) return;
    setDeleteAllExpiredLoading(true);
    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .lt("available_from", new Date(Date.now() - 48 * 36e5).toISOString());
      if (!error) await load();
    } finally {
      setDeleteAllExpiredLoading(false);
    }
  }

  const filtered = listings
    .filter(l =>
      l.to_city.toLowerCase().includes(search.toLowerCase()) ||
      l.from_city.toLowerCase().includes(search.toLowerCase()) ||
      l.driver_display_name.toLowerCase().includes(search.toLowerCase()) ||
      l.driver_phone.includes(search)
    )
    .sort((a, b) => {
      const av = sortKey === "price_gel" ? a[sortKey] : new Date(a[sortKey]).getTime();
      const bv = sortKey === "price_gel" ? b[sortKey] : new Date(b[sortKey]).getTime();
      return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  const expiredCount = listings.filter(l => isExpired(l.available_from)).length;
  const activeCount = listings.length - expiredCount;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-[var(--copart-blue)] ml-1">{sortAsc ? "↑" : "↓"}</span>;
  }

  if (authLoading || !user || profile?.role !== "admin") return (
    <main className="flex min-h-[80vh] items-center justify-center text-gray-400">
      <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </main>
  );

  return (
    <main className="min-h-screen bg-gray-50">
      {/* top bar */}
      <div className="bg-[var(--copart-blue)] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black">👑 Admin Panel</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
              {user.email ?? user.phone}
            </span>
          </div>
          <Link href="/" className="rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20 transition">
            ← Back to site
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
          {[
            { label: "Total listings", value: listings.length, icon: "📋", color: "bg-white" },
            { label: "Active", value: activeCount, icon: "✅", color: "bg-white" },
            { label: "Expired", value: expiredCount, icon: "⏰", color: "bg-white" },
            { label: "Users", value: userCount ?? "…", icon: "👤", color: "bg-white" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className={`${color} rounded-2xl border border-gray-200 p-4 shadow-sm`}>
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-2xl font-black text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 font-semibold">{label}</div>
            </div>
          ))}
        </div>

        {/* tabs */}
        <div className="flex gap-2 mb-4">
          {(["listings", "users"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === t ? "bg-[var(--copart-blue)] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {t === "listings" ? "📋 Listings" : "👤 Users"}
            </button>
          ))}
        </div>

        {tab === "listings" && (
          <>
            {/* toolbar */}
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <input
                className="flex-1 min-w-[200px] rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--copart-blue)] transition"
                placeholder="Search by city, driver, phone…"
                value={search} onChange={e => setSearch(e.target.value)}
              />
              <button onClick={load} disabled={loading}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
                🔄 Refresh
              </button>
              {expiredCount > 0 && (
                <button onClick={deleteAllExpired} disabled={deleteAllExpiredLoading}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 transition disabled:opacity-50">
                  {deleteAllExpiredLoading ? "Deleting…" : `🗑 Delete all expired (${expiredCount})`}
                </button>
              )}
            </div>

            {/* table */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left">
                      <th className="px-4 py-3 font-bold text-gray-600">Route</th>
                      <th className="px-4 py-3 font-bold text-gray-600">Driver</th>
                      <th className="px-4 py-3 font-bold text-gray-600 cursor-pointer select-none" onClick={() => toggleSort("price_gel")}>
                        Price <SortIcon k="price_gel" />
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">Spots</th>
                      <th className="px-4 py-3 font-bold text-gray-600 cursor-pointer select-none" onClick={() => toggleSort("available_from")}>
                        Available <SortIcon k="available_from" />
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600 cursor-pointer select-none" onClick={() => toggleSort("created_at")}>
                        Posted <SortIcon k="created_at" />
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">Status</th>
                      <th className="px-4 py-3 font-bold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Loading…</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No listings found</td></tr>
                    ) : filtered.map(l => {
                      const expired = isExpired(l.available_from);
                      return (
                        <tr key={l.id} className={`border-b border-gray-50 hover:bg-gray-50 transition ${expired ? "opacity-60" : ""}`}>
                          <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">
                            {l.from_city} → {l.to_city}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            <div className="font-semibold text-gray-800">{l.driver_display_name}</div>
                            <div className="text-xs text-gray-400">{l.driver_phone}</div>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900">{l.price_gel} ₾</td>
                          <td className="px-4 py-3 text-gray-600">{l.spots_available}/{l.capacity_total}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{formatDate(l.available_from)}</td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{formatDate(l.created_at)}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${expired ? "bg-gray-100 text-gray-500" : "bg-emerald-100 text-emerald-700"}`}>
                              {expired ? "Expired" : "Active"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Link href={`/listing/${l.id}/edit?lang=en`}
                                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-bold text-gray-600 hover:bg-gray-50 transition">
                                ✎ Edit
                              </Link>
                              <button
                                onClick={() => handleDelete(l.id)}
                                disabled={deletingId === l.id}
                                className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-100 transition disabled:opacity-50">
                                {deletingId === l.id ? "…" : "🗑"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filtered.length > 0 && (
                <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100">
                  Showing {filtered.length} of {listings.length} listings
                </div>
              )}
            </div>
          </>
        )}

        {tab === "users" && <UsersTab />}
      </div>
    </main>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<{ id: string; role: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("profiles").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setUsers(data ?? []); setLoading(false); });
  }, []);

  async function toggleRole(id: string, current: string) {
    const next = current === "admin" ? "driver" : "admin";
    if (!confirm(`Change role to "${next}"?`)) return;
    setUpdatingId(id);
    await supabase.from("profiles").update({ role: next }).eq("id", id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: next } : u));
    setUpdatingId(null);
  }

  if (loading) return <div className="py-10 text-center text-gray-400">Loading…</div>;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left">
            <th className="px-4 py-3 font-bold text-gray-600">User ID</th>
            <th className="px-4 py-3 font-bold text-gray-600">Role</th>
            <th className="px-4 py-3 font-bold text-gray-600">Joined</th>
            <th className="px-4 py-3 font-bold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">No users yet</td></tr>
          ) : users.map(u => (
            <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{u.id.slice(0, 16)}…</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                  {u.role === "admin" ? "👑 admin" : "🚛 driver"}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => toggleRole(u.id, u.role)}
                  disabled={updatingId === u.id}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
                  {updatingId === u.id ? "…" : u.role === "admin" ? "→ driver" : "→ admin"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}