export interface Job {
  id: number;
  slug: string;
  title: string;
  title_hindi?: string;
  category: string;
  state: string;
  post_type?: string;
  qualification?: string;
  total_posts?: number;
  last_date?: string;       // ISO date string
  apply_start?: string;
  age_min?: number;
  age_max?: number;
  salary?: string;
  application_fee?: string;
  official_url?: string;
  notification_pdf?: string;
  source?: string;
  status: "active" | "expired" | "result_out" | "admit_card";
  created_at: string;
  updated_at: string;
}

export interface JobsResponse {
  jobs: Job[];
  page: number;
  limit: number;
  count: number;
}

export type Category =
  | "hssc"
  | "hpsc"
  | "police"
  | "patwari"
  | "teacher"
  | "banking"
  | "railway"
  | "ssc"
  | "other";

export type Qualification =
  | "10th"
  | "12th"
  | "graduate"
  | "postgraduate"
  | "any";

export const CATEGORY_LABELS: Record<string, string> = {
  hssc:    "HSSC",
  hpsc:    "HPSC",
  police:  "Police",
  patwari: "Patwari",
  teacher: "Teacher",
  banking: "Banking",
  railway: "Railway",
  ssc:     "SSC",
  other:   "Other",
};

export const CATEGORY_HINDI: Record<string, string> = {
  hssc:    "HSSC",
  hpsc:    "HPSC",
  police:  "पुलिस",
  patwari: "पटवारी",
  teacher: "शिक्षक",
  banking: "बैंकिंग",
  railway: "रेलवे",
  ssc:     "SSC",
  other:   "अन्य",
};

export const QUALIFICATION_LABELS: Record<string, string> = {
  "10th":        "10वीं पास",
  "12th":        "12वीं पास",
  graduate:      "स्नातक",
  postgraduate:  "स्नातकोत्तर",
  any:           "सभी",
};
