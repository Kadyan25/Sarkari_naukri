"use client";
import { useEffect, useState } from "react";

function calcDays(lastDate: string): number {
  return Math.ceil((new Date(lastDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

interface Props {
  lastDate: string;
  lang?: "hi" | "en";
}

export default function Countdown({ lastDate, lang = "hi" }: Props) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    setDays(calcDays(lastDate));
  }, [lastDate]);

  if (days === null) return <span className="inline-block w-14 h-3.5 skeleton" />;

  const labels = {
    expired: lang === "hi" ? "समाप्त"       : "Expired",
    lastDay: lang === "hi" ? "आखिरी दिन!"   : "Last Day!",
    left:    lang === "hi" ? "दिन बाकी"     : "days left",
  };

  if (days < 0)  return <span className="text-xs text-red-500 font-medium">{labels.expired}</span>;
  if (days === 0) return <span className="text-xs text-red-600 font-bold">{labels.lastDay}</span>;

  const color =
    days <= 3  ? "text-red-600"    :
    days <= 7  ? "text-orange-500" :
    days <= 15 ? "text-yellow-600" :
                 "text-green-600";

  return (
    <span className={`text-xs font-semibold ${color}`}>
      {days} {labels.left}
    </span>
  );
}
