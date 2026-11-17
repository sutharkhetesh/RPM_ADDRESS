"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Toggle light and dark mode"
      title="Change appearance"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="dark:hidden" size={18} />
      <Moon className="hidden dark:block" size={18} />
    </Button>
  );
}
