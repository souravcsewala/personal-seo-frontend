"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/layout/Header";
import Sidebar from "../../../components/layout/Sidebar";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import axios from "axios";
import { prodServerUrl } from "../../../global/server";

export default function AdminBacklinkPolicyPage() {
  const router = useRouter();
  const auth = useSelector((s) => s.auth);
  const isAdmin = String(auth?.role || "").toLowerCase() === "admin";
  const headers = useMemo(() => ({ "x-auth-token": auth?.accessToken || "" }), [auth?.accessToken]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [policy, setPolicy] = useState({
    blogs: {
      policy: "nofollow",
      externalOnly: true,
      whitelist: [],
      blacklist: [],
      maxExternalLinks: null,
      maxDofollowLinks: 5,
      exceedMode: "convert",
      openInNewTab: true,
      relWhenNofollow: "nofollow ugc",
      alwaysAddRelNoopener: true,
    },
    internalDomains: [],
  });

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

  const fetchPolicy = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${prodServerUrl}/admin/blog-link-policy-get`, { headers });
      if (data?.data) setPolicy(data.data);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load policy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPolicy(); }, []);

  const savePolicy = async () => {
    try {
      await axios.put(`${prodServerUrl}/admin/blog-link-policy-update`, policy, { headers });
      alert("Policy updated");
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Failed to update");
    }
  };

  const createPolicy = async () => {
    try {
      await axios.post(`${prodServerUrl}/admin/blog-link-policy-create`, policy, { headers });
      alert("Policy created");
      fetchPolicy();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Failed to create");
    }
  };

  const deletePolicy = async () => {
    if (!confirm("Delete the backlink policy?")) return;
    try {
      await axios.delete(`${prodServerUrl}/admin/blog-link-policy-delete`, { headers });
      alert("Policy deleted");
      fetchPolicy();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Failed to delete");
    }
  };

  const updateBlogsField = (key, value) => setPolicy((p) => ({ ...p, blogs: { ...p.blogs, [key]: value } }));
  const setInternalDomains = (value) => setPolicy((p) => ({ ...p, internalDomains: value }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">Backlink Policy</h1>

            {loading ? (
              <div className="text-gray-600">Loading…</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default rel policy</label>
                    <select value={policy.blogs.policy} onChange={(e) => updateBlogsField("policy", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="nofollow">nofollow</option>
                      <option value="dofollow">dofollow</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input id="externalOnly" type="checkbox" checked={!!policy.blogs.externalOnly} onChange={(e) => updateBlogsField("externalOnly", e.target.checked)} />
                    <label htmlFor="externalOnly" className="text-sm text-gray-700">External-only enforcement</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max external links</label>
                    <input type="number" value={policy.blogs.maxExternalLinks ?? ""} onChange={(e) => updateBlogsField("maxExternalLinks", e.target.value === "" ? null : Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="null for unlimited" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max dofollow links</label>
                    <input type="number" value={policy.blogs.maxDofollowLinks ?? 0} onChange={(e) => updateBlogsField("maxDofollowLinks", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">If limits exceeded</label>
                    <select value={policy.blogs.exceedMode} onChange={(e) => updateBlogsField("exceedMode", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="convert">convert</option>
                      <option value="reject">reject</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input id="openInNewTab" type="checkbox" checked={!!policy.blogs.openInNewTab} onChange={(e) => updateBlogsField("openInNewTab", e.target.checked)} />
                    <label htmlFor="openInNewTab" className="text-sm text-gray-700">Open links in new tab</label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">rel when nofollow</label>
                    <input value={policy.blogs.relWhenNofollow || ""} onChange={(e) => updateBlogsField("relWhenNofollow", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input id="alwaysAddRelNoopener" type="checkbox" checked={!!policy.blogs.alwaysAddRelNoopener} onChange={(e) => updateBlogsField("alwaysAddRelNoopener", e.target.checked)} />
                    <label htmlFor="alwaysAddRelNoopener" className="text-sm text-gray-700">Always add rel=noopener</label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Whitelist (comma-separated)</label>
                  <input value={(policy.blogs.whitelist || []).join(", ")} onChange={(e) => updateBlogsField("whitelist", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="example.com, partner.org" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blacklist (comma-separated)</label>
                  <input value={(policy.blogs.blacklist || []).join(", ")} onChange={(e) => updateBlogsField("blacklist", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="spam.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Internal domains (comma-separated)</label>
                  <input value={(policy.internalDomains || []).join(", ")} onChange={(e) => setInternalDomains(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="farzacademy.com, blog.farzacademy.com" />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button onClick={savePolicy} className="px-4 py-2 bg-[#C96442] text-white rounded-lg hover:bg-[#C96442]/90 cursor-pointer">Save</button>
                  <button onClick={createPolicy} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">Create</button>
                  <button onClick={deletePolicy} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer">Delete</button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}


