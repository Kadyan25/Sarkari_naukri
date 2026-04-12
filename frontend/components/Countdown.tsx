"use client";

import { useEffect, useState } from "react";

function calcDays(lastDate: string): number {
  return Math.ceil((new Date(lastDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function Countdown({ lastDate }: { lastDate: string }) {
  // mounted guard prevents hydration mismatch (Date.now() differs server vs client)
  const [mounted, setMounted] = useState(false);
  const [days, setDays] = useState(0);

  useEffect(() => {
    setDays(calcDays(lastDate));
    setMounted(true);
    const id = setInterval(() => setDays(calcDays(lastDate)), 60_000);
    return () => clearInterval(id);
  }, [lastDate]);

  // Render placeholder same size to avoid layout shift
  if (!mounted) return <span className="inline-block w-16 h-4 skeleton" />;

  if (days < 0)  return <span className="text-xs text-red-500 font-medium">Expired</span>;
  if (days === 0) return <span className="text-xs text-red-600 font-bold">Last Day!</span>;

  const color =
    days <= 3  ? "text-red-600" :
    days <= 7  ? "text-orange-500" :
    days <= 15 ? "text-yellow-600" :
                 "text-green-600";

  return (
    <span className={`text-xs font-semibold ${color}`}>
      {days} दिन बाकी
    </span>
  );
}
