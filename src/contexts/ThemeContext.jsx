
import React, { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext({
  theme: "dark",
  setTheme: () => null,
})

export const ThemeProvider = ({ children, defaultTheme = "dark", storageKey = "vite-ui-theme", ...props }) => {
  const [theme, setThemeState] = useState(() => {
    // Force theme to dark
    localStorage.setItem(storageKey, "dark");
    return "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");
    // Always apply dark theme
    root.classList.add("dark");
  }, [theme]); // Dependency array includes theme to re-run if themeState somehow changes

  const value = {
    theme,
    // Setter now only allows setting to 'dark'
    setTheme: (newTheme) => {
      if (newTheme === "dark") {
        localStorage.setItem(storageKey, "dark");
        setThemeState("dark");
      }
      // Ignore attempts to set to 'light' or 'system'
    },
  };

  return (
    <ThemeContext.Provider {...props} value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
