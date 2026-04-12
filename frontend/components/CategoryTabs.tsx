// Server-renderable — uses <Link> instead of router.push for instant prefetch
import Link from "next/link";

const TABS = [
  { key: "",        label: "सभी",    en: "All" },
  { key: "hssc",    label: "HSSC",   en: "HSSC" },
  { key: "hpsc",    label: "HPSC",   en: "HPSC" },
  { key: "police",  label: "पुलिस",  en: "Police" },
  { key: "banking", label: "बैंक",   en: "Banking" },
  { key: "railway", label: "रेलवे",  en: "Railway" },
  { key: "ssc",     label: "SSC",    en: "SSC" },
  { key: "teacher", label: "शिक्षक", en: "Teacher" },
];

export default function CategoryTabs({ active }: { active: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3"
         style={{ scrollbarWidth: "none" }}>
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        const href = tab.key ? `/?category=${tab.key}` : "/";
        return (
          <Link
            key={tab.key}
            href={href}
            prefetch={true}   // prefetch all category pages upfront (small pages)
            className={`
              flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold
              transition-colors duration-150 whitespace-nowrap
              ${isActive
                ? "bg-brand text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:border-brand hover:text-brand"
              }
            `}
          >
            <span className="hindi">{tab.label}</span>
            {tab.en !== tab.label && <span className="ml-1 opacity-70">({tab.en})</span>}
          </Link>
        );
      })}
    </div>
  );
}
