"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/lib/i18n";

function calcDays(lastDate: string): number {
  return Math.ceil((new Date(lastDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function Countdown({ lastDate }: { lastDate: string }) {
  const { lang } = useApp();
  const t = useT(lang);
  const [mounted, setMounted] = useState(false);
  const [days, setDays] = useState(0);

  useEffect(() => {
    setDays(calcDays(lastDate));
    setMounted(true);
    const id = setInterval(() => setDays(calcDays(lastDate)), 60_000);
    return () => clearInterval(id);
  }, [lastDate]);

  if (!mounted) return <span className="inline-block w-16 h-4 skeleton" />;
  if (days < 0)  return <span className="text-xs text-red-500 font-medium">{t("expired")}</span>;
  if (days === 0) return <span className="text-xs text-red-600 font-bold">{t("lastDay")}</span>;

  const color =
    days <= 3  ? "text-red-600" :
    days <= 7  ? "text-orange-500" :
    days <= 15 ? "text-yellow-600" :
                 "text-green-600";

  return (
    <span className={`text-xs font-semibold ${color}`}>
      {days} {t("daysLeft")}
    </span>
  );
}
