"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const themeStorageKey = "akari-neko-theme";
const themePreferenceStorageKey = "akari-neko-theme-preference";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedPreference = window.localStorage.getItem(themePreferenceStorageKey);
  const savedTheme = window.localStorage.getItem(themeStorageKey);

  if (savedPreference === "manual" && (savedTheme === "dark" || savedTheme === "light")) {
    return savedTheme;
  }

  return getSystemTheme();
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const isDarkTheme = theme === "dark";

    root.classList.toggle("dark", isDarkTheme);
    body.classList.toggle("dark", isDarkTheme);
    root.dataset.akariTheme = theme;
    body.dataset.akariTheme = theme;
    root.style.colorScheme = theme;
    body.style.colorScheme = theme;
  }, [theme]);

  const toggleDarkMode = useCallback(() => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";

      window.localStorage.setItem(themePreferenceStorageKey, "manual");
      window.localStorage.setItem(themeStorageKey, nextTheme);

      return nextTheme;
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      theme,
      isDarkMode: theme === "dark",
      toggleDarkMode,
    }),
    [theme, toggleDarkMode],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
