"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type Lang  = "hi" | "en";
export type Theme = "light" | "dark";

interface AppCtx {
  lang:        Lang;
  theme:       Theme;
  toggleLang:  () => void;
  toggleTheme: () => void;
}

const Ctx = createContext<AppCtx>({
  lang: "hi", theme: "light",
  toggleLang: () => {}, toggleTheme: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang,  setLang]  = useState<Lang>("hi");
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const l = localStorage.getItem("sn_lang")  as Lang  | null;
    const t = localStorage.getItem("sn_theme") as Theme | null;
    if (l) setLang(l);
    if (t) setTheme(t);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("sn_theme", theme);
  }, [theme, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("sn_lang", lang);
  }, [lang, ready]);

  return (
    <Ctx.Provider value={{
      lang, theme,
      toggleLang:  () => setLang(l  => l  === "hi" ? "en" : "hi"),
      toggleTheme: () => setTheme(t => t  === "light" ? "dark" : "light"),
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
