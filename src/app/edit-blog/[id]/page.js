"use client";

import React, { useEffect, useState } from "react";
import Header from "../../../components/layout/Header";
import Sidebar from "../../../components/layout/Sidebar";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useSelector } from "react-redux";
import { prodServerUrl } from "../../../global/server";
import dynamic from 'next/dynamic';
const QuillEditor = dynamic(() => import('../../../components/common/QuillEditor'), { ssr: false });

export default function EditBlogPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const auth = useSelector((s) => s.auth);
  const isLoggedIn = !!auth?.isAuthenticated && !!auth?.accessToken;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [catsError, setCatsError] = useState("");
  const [policy, setPolicy] = useState(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [contentWordCount, setContentWordCount] = useState(0);

  const countWordsFromHtml = (html) => {
    try {
      const el = document.createElement('div');
      el.innerHTML = html || '';
      const text = (el.textContent || el.innerText || '').trim();
      if (!text) return 0;
      return text.split(/\s+/).filter(Boolean).length;
    } catch (_) { return 0; }
  };

  const [form, setForm] = useState({ title: "", metaDescription: "", category: "", tags: "", imageAlt: "", featuredImage: "", content: "" });

  useEffect(() => {
    if (!isLoggedIn) { router.push("/login"); return; }

    // Load categories
    (async () => {
      setCatsLoading(true);
      try {
        const { data } = await axios.get(`${prodServerUrl}/get-all-category`);
        const items = Array.isArray(data?.data) ? data.data : [];
        setCategories(items);
      } catch (e) {
        setCatsError("Failed to load categories");
      } finally {
        setCatsLoading(false);
      }
    })();

    // Load backlink policy
    (async () => {
      setPolicyLoading(true);
      try {
        const { data } = await axios.get(`${prodServerUrl}/admin/blog-link-policy-public`);
        setPolicy(data?.data || null);
      } catch (_) {
        setPolicy(null);
      } finally {
        setPolicyLoading(false);
      }
    })();

    // Load blog data
    (async () => {
      try {
        const { data } = await axios.get(`${prodServerUrl}/blogs/${encodeURIComponent(id)}`);
        const b = data?.data;
        if (!b) throw new Error("Blog not found");
        setForm({
          title: b.title || "",
          metaDescription: b.metaDescription || "",
          category: b?.category?._id || b?.category || "",
          tags: Array.isArray(b.tags) ? b.tags.join(", ") : (b.tags || ""),
          imageAlt: b?.imageAlt || "",
          featuredImage: b?.signedUrl || b?.image || "",
          content: b?.content || "",
        });
      } catch (e) {
        setError(e?.response?.data?.message || e.message || "Failed to load blog");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isLoggedIn]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm((prev) => ({ ...prev, featuredImage: ev.target.result }));
      };
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitError("");
      setSubmitting(true);
      const wc = countWordsFromHtml(form.content);
      const headers = { "x-auth-token": auth.accessToken };
      // Use JSON update when not replacing image
      const payload = {
        title: form.title,
        metaDescription: form.metaDescription,
        category: form.category,
        tags: form.tags,
        imageAlt: form.imageAlt,
        content: form.content || "",
      };

      // If a new image file was chosen, upload via multipart by calling update endpoint with file
      if (imageFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => fd.append(k, v));
        fd.append("image", imageFile);
        const { data } = await axios.put(`${prodServerUrl}/blogs/update-blog/${encodeURIComponent(id)}`, fd, { headers });
        const updated = data?.data;
        const slug = updated?.slug || id;
        router.push(`/blog/${encodeURIComponent(slug)}`);
      } else {
        const { data } = await axios.put(`${prodServerUrl}/blogs/update-blog/${encodeURIComponent(id)}`, payload, { headers });
        const updated = data?.data;
        const slug = updated?.slug || id;
        router.push(`/blog/${encodeURIComponent(slug)}`);
      }
    } catch (err) {
      setSubmitError(err?.response?.data?.message || "Failed to update blog");
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
          <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Blog</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Blog Title *</label>
              <input id="title" value={form.title} onChange={(e)=>setForm(v=>({...v,title:e.target.value}))} placeholder="Enter an engaging title" className="w-full border border-gray-300 rounded p-2" />

              {/* Meta Description removed: backend can auto-generate if absent */}

              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category *</label>
              <select id="category" value={form.category} onChange={(e)=>setForm(v=>({...v,category:e.target.value}))} className="w-full border border-gray-300 rounded p-2">
                <option value="" disabled>{catsLoading ? "Loading..." : "Select a category"}</option>
                {categories.map((cat) => (
                  <option key={cat?._id || cat?.id || cat?.name} value={cat?._id || cat?.id || cat?.name}>
                    {cat?.name || "Unnamed"}
                  </option>
                ))}
              </select>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags</label>
              <input id="tags" value={form.tags} onChange={(e)=>setForm(v=>({...v,tags:e.target.value}))} placeholder="Tags (comma separated)" className="w-full border border-gray-300 rounded p-2" />

              {/* Featured Image with Alt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Featured Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {form.featuredImage ? (
                    <div className="space-y-3">
                      <img src={form.featuredImage} alt={form.imageAlt || "Featured image"} className="max-h-48 mx-auto rounded" />
                      <div className="flex items-center justify-center gap-3">
                        <label htmlFor="imageAlt" className="text-sm text-gray-700">Alt Text</label>
                        <input id="imageAlt" value={form.imageAlt} onChange={(e)=>setForm(v=>({...v,imageAlt:e.target.value}))} placeholder="Alt text for the image" className="w-full max-w-md border border-gray-300 rounded p-2" />
                        <button type="button" onClick={()=>{ setForm(v=>({...v, featuredImage:"", imageAlt:""})); setImageFile(null); }} className="text-red-600 text-sm">Remove</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input id="featuredImage" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      <label htmlFor="featuredImage" className="bg-[#C96442] text-white px-4 py-2 rounded cursor-pointer">Choose Image</label>
                    </div>
                  )}
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-700">Content *</label>
              <QuillEditor value={form.content} onChange={(content)=>{ setForm(v=>({...v, content})); setContentWordCount(countWordsFromHtml(content)); }} height={450} />
              <p className={'text-sm mt-1 text-gray-600'}>Words: {contentWordCount}</p>

              {/* Policy */}
              <div className="bg-orange-50 border border-orange-200 rounded p-4">
                <h4 className="font-medium text-orange-900 mb-2">Backlink Policy</h4>
                {policyLoading && <p className="text-orange-800">Loading policy…</p>}
                {!policyLoading && policy && (
                  <ul className="list-disc ml-5 text-sm text-orange-900 space-y-1">
                    <li>Default rel policy: <span className="font-medium">{policy.blogs?.policy}</span></li>
                    <li>External-only enforcement: <span className="font-medium">{policy.blogs?.externalOnly ? 'Yes' : 'No'}</span></li>
                    {typeof policy.blogs?.maxExternalLinks === 'number' && (
                      <li>Max external links: <span className="font-medium">{policy.blogs.maxExternalLinks}</span></li>
                    )}
                    {typeof policy.blogs?.maxDofollowLinks === 'number' && (
                      <li>Max dofollow links: <span className="font-medium">{policy.blogs.maxDofollowLinks}</span></li>
                    )}
                    <li>If limits exceeded: <span className="font-medium">{policy.blogs?.exceedMode}</span></li>
                    <li>Open links in new tab: <span className="font-medium">{policy.blogs?.openInNewTab ? 'Yes' : 'No'}</span></li>
                  </ul>
                )}
                {!policyLoading && !policy && (
                  <p className="text-orange-800 text-sm">Backlink policy is not configured.</p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={()=>router.back()} className="px-5 py-2 border border-gray-300 rounded">Cancel</button>
                <button type="submit" disabled={submitting} className={`px-5 py-2 text-white rounded ${submitting? 'bg-[#C96442]/60' : 'bg-[#C96442] hover:bg-[#C96442]/90'}`}>{submitting? 'Updating…' : 'Update'}</button>
              </div>
              {submitError && <div className="text-sm text-red-600">{submitError}</div>}
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}


