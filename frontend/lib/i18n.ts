import type { Lang } from "@/contexts/AppContext";

const strings = {
  hi: {
    siteName:       "सरकारी नौकरी",
    siteNameEn:     "Sarkari Naukri",
    tagline:        "सभी सरकारी नौकरियां एक जगह",
    alertBtn:       "अलर्ट पाएं",
    heroTitle:      "सरकारी नौकरी 2025",
    heroSub:        "HSSC · HPSC · Police · Banking · Railway — रोज नई भर्ती",
    telegramCta:    "Telegram पर अलर्ट पाएं — मुफ्त",
    freshJobs:      "ताजा भर्ती",
    dailyUpdate:    "रोज अपडेट",
    pickDept:       "विभाग चुनें",
    latestJobs:     "ताजा सरकारी नौकरियां",
    noJobs:         "अभी कोई भर्ती उपलब्ध नहीं है।",
    loadError:      "डेटा लोड नहीं हो सका। कृपया दोबारा कोशिश करें।",
    prev:           "← पिछला",
    next:           "अगला →",
    posts:          "पद",
    lastDate:       "अंतिम तिथि",
    daysLeft:       "दिन बाकी",
    expired:        "समाप्त",
    lastDay:        "आखिरी दिन!",
    footerCats:     "HSSC | HPSC | Police | Banking | Railway",
    footerNote:     "सभी सरकारी नौकरियां एक जगह। सरकारी वेबसाइटों से लिया गया डेटा।",
    footerCopy:     "© 2025 SarkariNaukri.in",
    aboutTitle:     "सरकारी नौकरी के बारे में",
    aboutText:      "सरकारी नौकरी पाने का सपना देखने वाले सभी युवाओं के लिए यह प्लेटफॉर्म बना है। HSSC, HPSC, पुलिस, बैंकिंग, रेलवे और SSC की सभी भर्तियां एक ही जगह मिलती हैं। हर नई भर्ती के लिए Telegram अलर्ट पाएं — बिल्कुल मुफ्त।",
    recruitments:   "भर्ती 2025",
    // category tabs
    all:            "सभी",
    police:         "पुलिस",
    banking:        "बैंक",
    railway:        "रेलवे",
    teacher:        "शिक्षक",
    patwari:        "पटवारी",
  },
  en: {
    siteName:       "Sarkari Naukri",
    siteNameEn:     "Sarkari Naukri",
    tagline:        "All Government Jobs in One Place",
    alertBtn:       "Get Alerts",
    heroTitle:      "Government Jobs 2025",
    heroSub:        "HSSC · HPSC · Police · Banking · Railway — Updated Daily",
    telegramCta:    "Get Free Telegram Alerts",
    freshJobs:      "Fresh Jobs",
    dailyUpdate:    "Daily Update",
    pickDept:       "Select Department",
    latestJobs:     "Latest Government Jobs",
    noJobs:         "No jobs available right now.",
    loadError:      "Could not load data. Please try again.",
    prev:           "← Prev",
    next:           "Next →",
    posts:          "Posts",
    lastDate:       "Last Date",
    daysLeft:       "days left",
    expired:        "Expired",
    lastDay:        "Last Day!",
    footerCats:     "HSSC | HPSC | Police | Banking | Railway",
    footerNote:     "All government jobs in one place. Data sourced from official websites.",
    footerCopy:     "© 2025 SarkariNaukri.in",
    aboutTitle:     "About Government Jobs",
    aboutText:      "This platform is built for all youth who dream of getting a government job. Find all HSSC, HPSC, Police, Banking, Railway and SSC vacancies in one place. Get free Telegram alerts for every new recruitment.",
    recruitments:   "Recruitment 2025",
    // category tabs
    all:            "All",
    police:         "Police",
    banking:        "Banking",
    railway:        "Railway",
    teacher:        "Teacher",
    patwari:        "Patwari",
  },
} as const;

export type TKey = keyof typeof strings.hi;

export function useT(lang: Lang) {
  return (key: TKey): string => strings[lang][key] as string;
}

export { strings };
