"use client";

import Link from "next/link";

export default function JobError({ reset }: { reset: () => void }) {
  return (
    <div className="card text-center py-12 space-y-4 max-w-md mx-auto mt-8">
      <p className="text-2xl">🔍</p>
      <h2 className="hindi font-semibold text-gray-800">
        यह भर्ती नहीं मिली
      </h2>
      <p className="hindi text-sm text-gray-500">
        यह नौकरी expire हो गई हो सकती है या link गलत हो सकता है।
      </p>
      <div className="flex gap-3 justify-center">
        <button onClick={reset} className="btn-primary">दोबारा कोशिश</button>
        <Link href="/" className="btn-primary bg-gray-500 hover:bg-gray-600">
          होम पर जाएं
        </Link>
      </div>
    </div>
  );
}
