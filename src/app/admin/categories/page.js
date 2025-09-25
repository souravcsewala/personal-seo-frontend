"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/layout/Header";
import Sidebar from "../../../components/layout/Sidebar";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import axios from "axios";
import { prodServerUrl } from "../../../global/server";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const auth = useSelector((s) => s.auth);
  const isAdmin = String(auth?.role || "").toLowerCase() === "admin";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  const [form, setForm] = useState({ id: null, name: "", description: "" });
  const isEditing = useMemo(() => !!form.id, [form.id]);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('authState') : null;
      const stored = raw ? JSON.parse(raw) : null;
      const token = auth?.accessToken || stored?.accessToken;
      const role = String(auth?.role || stored?.role || stored?.user?.role || '').toLowerCase();
      if (!token) {
        router.push('/login');
        return;
      }
      if (role !== 'admin') {
        router.push('/permission-denied');
        return;
      }
    } catch (_) {
      router.push('/login');
    }
  }, [auth, router]);

  const headers = useMemo(() => ({ "x-auth-token": auth?.accessToken || "" }), [auth?.accessToken]);

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit };
      if (q) params.q = q;
      const { data } = await axios.get(`${prodServerUrl}/get-all-category`, { params });
      setItems(Array.isArray(data?.data) ? data.data : []);
      setTotal(data?.pagination?.total || 0);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load categories");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const resetForm = () => setForm({ id: null, name: "", description: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.name.trim()) return;
      if (isEditing) {
        await axios.put(`${prodServerUrl}/update-category/${form.id}`, { name: form.name.trim(), description: form.description }, { headers });
      } else {
        await axios.post(`${prodServerUrl}/create-category`, { name: form.name.trim(), description: form.description }, { headers });
      }
      resetForm();
      await fetchList();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Failed to save");
    }
  };

  const handleEdit = (cat) => setForm({ id: cat._id, name: cat.name || "", description: cat.description || "" });

  const handleDelete = async (id) => {
    if (!confirm("Delete this category?")) return;
    try {
      await axios.delete(`${prodServerUrl}/delete-category/${id}`, { headers });
      await fetchList();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Failed to delete");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Manage Categories</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent" placeholder="e.g. SEO Basics" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent" placeholder="Optional description" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" className="px-4 py-2 bg-[#C96442] text-white rounded-lg hover:bg-[#C96442]/90 transition-colors cursor-pointer">{isEditing ? "Update Category" : "Create Category"}</button>
                {isEditing && (
                  <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">Cancel</button>
                )}
              </div>
            </form>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name/description" className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent" />
                  <button onClick={() => { setPage(1); fetchList(); }} className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 cursor-pointer">Search</button>
                </div>
                <div className="flex items-center gap-2">
                  <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="px-2 py-2 border border-gray-300 rounded-lg">
                    {[10, 20, 50, 100].map((n) => (<option key={n} value={n}>{n}/page</option>))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="text-gray-600">Loading…</div>
              ) : error ? (
                <div className="text-red-600">{error}</div>
              ) : items.length === 0 ? (
                <div className="text-gray-600">No categories found.</div>
              ) : (
                <div className="divide-y">
                  {items.map((cat) => (
                    <div key={cat._id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium text-gray-900">{cat.name}</div>
                        {cat.description ? (
                          <div className="text-sm text-gray-600">{cat.description}</div>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleEdit(cat)} className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">Edit</button>
                        <button onClick={() => handleDelete(cat._id)} className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
                <div className="flex items-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className={`px-3 py-1 rounded-lg border ${page <= 1 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'} cursor-pointer`}>Prev</button>
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className={`px-3 py-1 rounded-lg border ${page >= totalPages ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'} cursor-pointer`}>Next</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


