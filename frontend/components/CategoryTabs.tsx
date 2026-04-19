import Link from "next/link";

const TABS = [
  { key: "",        en: "All",     hi: "सभी"    },
  { key: "hssc",    en: "HSSC",    hi: "HSSC"   },
  { key: "hpsc",    en: "HPSC",    hi: "HPSC"   },
  { key: "police",  en: "Police",  hi: "पुलिस"  },
  { key: "banking", en: "Banking", hi: "बैंक"   },
  { key: "railway", en: "Railway", hi: "रेलवे"  },
  { key: "ssc",     en: "SSC",     hi: "SSC"    },
  { key: "teacher", en: "Teacher", hi: "शिक्षक" },
  { key: "upsc",    en: "UPSC",    hi: "UPSC"   },
] as const;

interface Props {
  active: string;
  lang?: "hi" | "en";
}

export default function CategoryTabs({ active, lang = "hi" }: Props) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3"
      style={{ scrollbarWidth: "none" }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        const href     = tab.key ? `/?category=${tab.key}` : "/";
        const label    = lang === "hi" ? tab.hi : tab.en;

        return (
          <Link
            key={tab.key}
            href={href}
            prefetch={true}
            className={`
              flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold
              transition-colors duration-150 whitespace-nowrap hindi
              ${isActive
                ? "bg-brand text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:border-brand hover:text-brand dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:border-brand dark:hover:text-brand-light"
              }
            `}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
