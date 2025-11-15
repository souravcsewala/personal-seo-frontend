"use client";

import React, { useEffect, useState } from "react";
import Header from "../../../components/layout/Header";
import Sidebar from "../../../components/layout/Sidebar";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useSelector } from "../../../redux/useSelectorSafe";
import { prodServerUrl } from "../../../global/server";
import dynamicImport from 'next/dynamic';

// Force dynamic rendering to prevent prerender errors with client hooks
export const dynamic = 'force-dynamic';

const QuillEditor = dynamicImport(() => import('../../../components/common/QuillEditor'), { ssr: false });

export default function EditQuestionPage() {
 const params = useParams();
 const id = params?.id;
 const router = useRouter();
 const auth = useSelector((s) => s.auth, { isAuthenticated: false, accessToken: null });
 const isLoggedIn = !!auth?.isAuthenticated && !!auth?.accessToken;

 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [submitting, setSubmitting] = useState(false);
 const [submitError, setSubmitError] = useState("");

 const [form, setForm] = useState({ title: "", description: "" });

 useEffect(() => {
  if (!isLoggedIn) { router.push("/login"); return; }
  (async () => {
   try {
    const { data } = await axios.get(`${prodServerUrl}/questions/${encodeURIComponent(id)}`);
    const q = data?.data;
    if (!q) throw new Error("Question not found");
    setForm({ title: q.title || "", description: q.description || "" });
   } catch (e) {
    setError(e?.response?.data?.message || e.message || "Failed to load question");
   } finally {
    setLoading(false);
   }
  })();
 }, [id, isLoggedIn]);

 const handleSubmit = async (e) => {
  e.preventDefault();
  try {
   setSubmitError("");
   setSubmitting(true);
   const headers = { "x-auth-token": auth.accessToken };
   const payload = { title: form.title, description: form.description || "" };
   const { data } = await axios.put(`${prodServerUrl}/questions/${encodeURIComponent(id)}`, payload, { headers });
   const updated = data?.data;
   const slug = updated?.slug || id;
   router.push(`/question/${encodeURIComponent(slug)}`);
  } catch (err) {
   setSubmitError(err?.response?.data?.message || "Failed to update question");
  } finally {
   setSubmitting(false);
  }
 };

 if (loading) return <div className="min-h-screen bg-gray-50"><Header /><div className="flex"><Sidebar /><main className="flex-1 p-6"><div className="max-w-4xl mx-auto text-gray-600">Loading...</div></main></div></div>;
 if (error) return <div className="min-h-screen bg-gray-50"><Header /><div className="flex"><Sidebar /><main className="flex-1 p-6"><div className="max-w-4xl mx-auto text-red-600">{error}</div></main></div></div>;

 return (
  <div className="min-h-screen bg-gray-50">
   <Header />
   <div className="flex">
    <Sidebar />
    <main className="flex-1 p-6">
     <div className="max-w-4xl mx-auto bg-white border border-gray-200 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Question</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
       <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title *</label>
       <input id="title" value={form.title} onChange={(e)=>setForm(v=>({...v,title:e.target.value}))} placeholder="Enter your question title" className="w-full border border-gray-300 p-2" />

       <label className="block text-sm font-medium text-gray-700">Description *</label>
       <QuillEditor value={form.description} onChange={(html)=>setForm(v=>({...v, description: html}))} height={350} autoFocusEditor={false} />

       <div className="flex justify-end gap-3">
        <button type="button" onClick={()=>router.back()} className="px-5 py-2 border border-gray-300">Cancel</button>
        <button type="submit" disabled={submitting} className={`px-5 py-2 text-white ${submitting? 'bg-[#C96442]/60' : 'bg-[#C96442] hover:bg-[#C96442]/90'}`}>{submitting? 'Updating…' : 'Update'}</button>
       </div>
       {submitError && <div className="text-sm text-red-600">{submitError}</div>}
      </form>
     </div>
    </main>
   </div>
  </div>
 );
}






