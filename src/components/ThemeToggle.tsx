"use client";

import { useState } from "react";

export default function ThemeToggle({ initialTheme }: { initialTheme: "light" | "dark" }) {
  const [theme, setTheme] = useState(initialTheme);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.dataset.theme = "dark";
    } else {
      delete document.documentElement.dataset.theme;
    }
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-surface"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
