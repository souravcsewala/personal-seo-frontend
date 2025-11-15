"use client";

import React, { useEffect, useState } from "react";
import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";
import { useRouter } from "next/navigation";
import axios from "axios";
import { prodServerUrl } from "../../global/server";

// Force dynamic rendering to prevent prerender errors with client hooks
export const dynamic = 'force-dynamic';

export default function SavedPage() {
 const router = useRouter();
 const [items, setItems] = useState([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  try {
   const raw = typeof window !== "undefined" ? localStorage.getItem("savedBlogs") : null;
   const keys = raw ? JSON.parse(raw) : [];
   if (!Array.isArray(keys) || keys.length === 0) {
    setItems([]);
    setLoading(false);
    return;
   }
   (async () => {
    const results = [];
    for (const key of keys) {
     try {
      const { data } = await axios.get(`${prodServerUrl}/blogs/${encodeURIComponent(key)}`);
      const b = data?.data;
      if (!b) continue;
      results.push({
       id: b._id,
       slug: b.slug,
       title: b.title,
       excerpt: b.metaDescription || "",
       image: b.signedUrl || b.image,
       author: b?.author?.fullname,
       createdAt: b?.createdAt,
      });
     } catch (_) {}
    }
    setItems(results);
    setLoading(false);
   })();
  } catch (_) {
   setItems([]);
   setLoading(false);
  }
 }, []);

 return (
  <div className="min-h-screen bg-gray-50">
   <Header />
   <div className="flex">
    <Sidebar />
    <main className="flex-1 p-6">
     <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
       <h1 className="text-2xl font-bold text-gray-900">Saved Posts</h1>
       <button
        onClick={() => router.push('/profile')}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        title="Back to Profile"
       >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back</span>
       </button>
      </div>
      {loading ? (
       <div className="text-gray-600">Loading...</div>
      ) : items.length === 0 ? (
       <div className="text-gray-600">No saved posts.</div>
      ) : (
       <div className="space-y-4">
        {items.map((it) => (
         <div key={it.id} className="flex space-x-4 bg-white border border-gray-200 p-4 hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/blog/${encodeURIComponent(it.slug || it.id)}`)}>
          {it.image && (
           <img src={it.image} alt={it.title} className="w-24 h-24 object-cover rounded" />
          )}
          <div className="flex-1">
           <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{it.title}</h3>
           <p className="text-sm text-gray-600 line-clamp-2">{it.excerpt}</p>
           <div className="text-xs text-gray-500 mt-1">
            {it.author ? <span>{it.author} • </span> : null}
            {it.createdAt ? new Date(it.createdAt).toLocaleDateString() : ""}
           </div>
          </div>
         </div>
        ))}
       </div>
      )}
     </div>
    </main>
   </div>
  </div>
 );
}


