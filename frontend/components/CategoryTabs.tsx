"use client";
import Link from "next/link";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/lib/i18n";

const TABS = [
  { key: "",        hiKey: "all",     label: "HSSC"    },
  { key: "hssc",    hiKey: null,      label: "HSSC"    },
  { key: "hpsc",    hiKey: null,      label: "HPSC"    },
  { key: "police",  hiKey: "police",  label: "Police"  },
  { key: "banking", hiKey: "banking", label: "Banking" },
  { key: "railway", hiKey: "railway", label: "Railway" },
  { key: "ssc",     hiKey: null,      label: "SSC"     },
  { key: "teacher", hiKey: "teacher", label: "Teacher" },
] as const;

export default function CategoryTabs({ active }: { active: string }) {
  const { lang } = useApp();
  const t = useT(lang);

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3"
      style={{ scrollbarWidth: "none" }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        const href     = tab.key ? `/?category=${tab.key}` : "/";
        const displayLabel =
          tab.key === ""
            ? t("all")
            : tab.hiKey
            ? lang === "hi" ? t(tab.hiKey) : tab.label
            : tab.label;

        return (
          <Link
            key={tab.key}
            href={href}
            prefetch={true}
            className={`
              flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold
              transition-colors duration-150 whitespace-nowrap
              ${isActive
                ? "bg-brand text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:border-brand hover:text-brand dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:border-brand dark:hover:text-brand-light"
              }
            `}
          >
            {displayLabel}
          </Link>
        );
      })}
    </div>
  );
}
