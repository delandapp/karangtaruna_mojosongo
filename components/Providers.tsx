"use client";

import { Provider } from "react-redux";
import { ThemeProvider } from "next-themes";
import { store } from "@/store/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <Provider store={store}>{children}</Provider>
    </ThemeProvider>
  );
}
