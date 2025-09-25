"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PermissionDeniedPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8 text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86l-7.6 13.15A2 2 0 004.3 20h15.4a2 2 0 001.71-2.99l-7.6-13.15a2 2 0 00-3.52 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Permission Denied</h1>
        <p className="text-gray-600 mb-6">You do not have access to this page.</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => router.push('/')} className="px-4 py-2 bg-[#C96442] text-white rounded-lg hover:bg-[#C96442]/90">Go Home</button>
          <Link href="/login" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Login</Link>
        </div>
      </div>
    </div>
  );
}


