"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/layout/Header";
import Sidebar from "../../../components/layout/Sidebar";
import { useSelector } from "../../../redux/useSelectorSafe";
import { useRouter } from "next/navigation";
import axios from "axios";
import { prodServerUrl } from "../../../global/server";
import dynamicImport from "next/dynamic";

// Force dynamic rendering to prevent prerender errors with client hooks
export const dynamic = 'force-dynamic';

const QuillEditor = dynamicImport(() => import("../../../components/common/QuillEditor"), { ssr: false });
import LoadingIndicator from "../../../components/common/LoadingIndicator";

export default function AdminAnnouncementsPage() {
 const router = useRouter();
 const auth = useSelector((s) => s.auth, { isAuthenticated: false, accessToken: null });

 const [items, setItems] = useState([]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [page, setPage] = useState(1);
 const [limit, setLimit] = useState(20);
 const [total, setTotal] = useState(0);

 const [logsOpenFor, setLogsOpenFor] = useState(null);
 const [logs, setLogs] = useState([]);
 const [logsLoading, setLogsLoading] = useState(false);
 const [logsError, setLogsError] = useState("");

 const [form, setForm] = useState({
  id: null,
  title: "",
  contentHtml: "",
  linkUrl: "",
  isActive: true,
  priority: 0,
  startAt: "",
  endAt: "",
  sendPush: true,
 });

 const isEditing = useMemo(() => !!form.id, [form.id]);

 useEffect(() => {
  try {
   const raw = typeof window !== 'undefined' ? localStorage.getItem('authState') : null;
   const stored = raw ? JSON.parse(raw) : null;
   const token = auth?.accessToken || stored?.accessToken;
   const role = String(auth?.role || stored?.role || stored?.user?.role || '').toLowerCase();
   if (!token) { router.push('/login'); return; }
   if (role !== 'admin') { router.push('/permission-denied'); return; }
  } catch (_) { router.push('/login'); }
 }, [auth, router]);

 const headers = useMemo(() => ({ "x-auth-token": auth?.accessToken || "" }), [auth?.accessToken]);

 const fetchList = async () => {
  setLoading(true);
  setError("");
  try {
   const { data } = await axios.get(`${prodServerUrl}/announcements`, { params: { page, limit } });
   const list = Array.isArray(data?.data) ? data.data : [];
   setItems(list);
   setTotal(data?.pagination?.total || list.length);
  } catch (e) {
   setError(e?.response?.data?.message || e.message || "Failed to load announcements");
   setItems([]);
   setTotal(0);
  } finally { setLoading(false); }
 };

 useEffect(() => { fetchList(); /* eslint-disable-next-line */ }, [page, limit]);

 const resetForm = () => setForm({ id: null, title: "", contentHtml: "", linkUrl: "", isActive: true, priority: 0, startAt: "", endAt: "", sendPush: true });

 const toDateLocal = (iso) => {
  if (!iso) return "";
  try {
   const d = new Date(iso);
   const pad = (n) => String(n).padStart(2, '0');
   const yyyy = d.getFullYear();
   const mm = pad(d.getMonth() + 1);
   const dd = pad(d.getDate());
   return `${yyyy}-${mm}-${dd}`;
  } catch { return ""; }
 };

 const handleSubmit = async (e) => {
  e.preventDefault();
  try {
   if (!form.title.trim()) { alert('Title is required'); return; }
   const payload = {
    title: form.title.trim(),
    contentHtml: form.contentHtml,
    linkUrl: form.linkUrl,
    isActive: !!form.isActive,
    priority: Number(form.priority || 0),
    startAt: form.startAt ? new Date(form.startAt).toISOString() : undefined,
    endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
    sendPush: !!form.sendPush,
   };
   if (isEditing) {
    await axios.put(`${prodServerUrl}/announcements/${form.id}`, payload, { headers });
   } else {
    await axios.post(`${prodServerUrl}/announcements`, payload, { headers });
   }
   resetForm();
   await fetchList();
  } catch (e) {
   alert(e?.response?.data?.message || e.message || "Failed to save");
  }
 };

 const handleEdit = (a) => setForm({
  id: a._id,
  title: a.title || "",
  contentHtml: a.contentHtml || "",
  linkUrl: a.linkUrl || "",
  isActive: !!a.isActive,
  priority: Number(a.priority || 0),
  startAt: toDateLocal(a.startAt),
  endAt: toDateLocal(a.endAt),
  sendPush: true,
 });

 const handleDelete = async (id) => {
  if (!confirm("Delete this announcement?")) return;
  try {
   await axios.delete(`${prodServerUrl}/announcements/${id}`, { headers });
   await fetchList();
  } catch (e) {
   alert(e?.response?.data?.message || e.message || "Failed to delete");
  }
 };

 const openLogs = async (announcementId) => {
  setLogsOpenFor(announcementId);
  setLogs([]);
  setLogsError("");
  setLogsLoading(true);
  try {
   const { data } = await axios.get(`${prodServerUrl}/announcements/${announcementId}/push-sends`, { headers, params: { limit: 50 } });
   setLogs(Array.isArray(data?.data) ? data.data : []);
  } catch (e) {
   setLogsError(e?.response?.data?.message || e.message || "Failed to load logs");
  } finally { setLogsLoading(false); }
 };

 const closeLogs = () => {
  setLogsOpenFor(null);
  setLogs([]);
  setLogsError("");
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
       <h1 className="text-2xl font-bold text-gray-900">Manage Announcements</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6 space-y-4">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
         <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
         <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent" placeholder="e.g. Scheduled maintenance tonight" />
        </div>
        <div className="md:col-span-2">
         <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
         <QuillEditor
          value={form.contentHtml}
          onChange={(html) => setForm((p) => ({ ...p, contentHtml: html }))}
          height={350}
         />
        </div>
        <div className="md:col-span-2">
         <label className="block text-sm font-medium text-gray-700 mb-1">Link URL (optional)</label>
         <input value={form.linkUrl} onChange={(e) => setForm((p) => ({ ...p, linkUrl: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent" placeholder="https://example.com or /announcements" />
        </div>
        <div>
         <label className="block text-sm font-medium text-gray-700 mb-1">Start At</label>
         <input type="date" placeholder="dd-mm-yyyy" value={form.startAt} onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent" />
        </div>
        <div>
         <label className="block text-sm font-medium text-gray-700 mb-1">End At</label>
         <input type="date" placeholder="dd-mm-yyyy" value={form.endAt} onChange={(e) => setForm((p) => ({ ...p, endAt: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent" />
        </div>
        <div>
         <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
         <input type="number" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C96442] focus:border-transparent" />
        </div>
        <div className="flex items-center gap-2">
         <input id="isActive" type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4 border-gray-300 rounded" />
         <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
        </div>
        <div className="flex items-center gap-2">
         <input id="sendPush" type="checkbox" checked={form.sendPush} onChange={(e) => setForm((p) => ({ ...p, sendPush: e.target.checked }))} className="h-4 w-4 border-gray-300 rounded" />
         <label htmlFor="sendPush" className="text-sm text-gray-700">Send Push Notification</label>
        </div>
       </div>
       <div className="flex items-center gap-3">
        <button type="submit" className="px-4 py-2 bg-[#C96442] text-white hover:bg-[#C96442]/90 transition-colors cursor-pointer">{isEditing ? "Update Announcement" : "Create Announcement"}</button>
        {isEditing && (
         <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">Cancel</button>
        )}
       </div>
      </form>

      <div className="bg-white border border-gray-200 p-6">
       <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
         <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="px-2 py-2 border border-gray-300 ">
          {[10, 20, 50, 100].map((n) => (<option key={n} value={n}>{n}/page</option>))}
         </select>
        </div>
       </div>

       {loading ? (
        <div className="py-6"><LoadingIndicator /></div>
       ) : error ? (
        <div className="text-red-600">{error}</div>
       ) : items.length === 0 ? (
        <div className="text-gray-600">No announcements found.</div>
       ) : (
        <div className="divide-y">
         {items.map((a) => (
          <div key={a._id} className="flex items-center justify-between py-3">
           <div>
            <div className="font-medium text-gray-900">{a.title}</div>
            <div className="text-sm text-gray-600 flex items-center gap-2">
             <span>{a.isActive ? 'Active' : 'Inactive'}</span>
             {a.priority !== undefined && (<span>• Priority {a.priority}</span>)}
             {(a.startAt || a.endAt) && (
              <span>
               • {a.startAt ? new Date(a.startAt).toLocaleString() : 'now'} → {a.endAt ? new Date(a.endAt).toLocaleString() : '∞'}
              </span>
             )}
            </div>
           </div>
           <div className="flex items-center gap-3">
            <button onClick={() => handleEdit(a)} className="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">Edit</button>
            <button onClick={() => openLogs(a._id)} className="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">View Sends</button>
            <button onClick={() => handleDelete(a._id)} className="px-3 py-1 bg-red-600 text-white hover:bg-red-700 cursor-pointer">Delete</button>
           </div>
          </div>
         ))}
        </div>
       )}

       <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
        <div className="flex items-center gap-2">
         <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className={`px-3 py-1 border ${page <= 1 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'} cursor-pointer`}>Prev</button>
         <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className={`px-3 py-1 border ${page >= totalPages ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'} cursor-pointer`}>Next</button>
        </div>
       </div>
      </div>
     </div>
    </main>
   </div>
   {logsOpenFor && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
     <div className="bg-white shadow-lg w-full max-w-2xl p-6">
      <div className="flex items-center justify-between mb-4">
       <h2 className="text-lg font-semibold">Push Sends</h2>
       <button onClick={closeLogs} className="text-gray-600 hover:text-gray-900">✕</button>
      </div>
      {logsLoading ? (
       <div className="py-6"><LoadingIndicator /></div>
      ) : logsError ? (
       <div className="text-red-600">{logsError}</div>
      ) : logs.length === 0 ? (
       <div className="text-gray-600">No sends yet.</div>
      ) : (
       <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
         <thead>
          <tr className="text-left text-gray-600">
           <th className="py-2 pr-4">Sent At</th>
           <th className="py-2 pr-4">Success</th>
           <th className="py-2 pr-4">Failure</th>
          </tr>
         </thead>
         <tbody>
          {logs.map((l) => (
           <tr key={l._id} className="border-t">
            <td className="py-2 pr-4">{l.sentAt ? new Date(l.sentAt).toLocaleString() : ''}</td>
            <td className="py-2 pr-4 text-green-700">{l.successCount}</td>
            <td className="py-2 pr-4 text-red-700">{l.failureCount}</td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      )}
      <div className="mt-4 text-right">
       <button onClick={closeLogs} className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">Close</button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}


