"use client";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <WorkspaceToaster />
    </ThemeProvider>
  );
}

function WorkspaceToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      richColors
      position="bottom-right"
      closeButton
    />
  );
}
