// Lets a screen nested arbitrarily deep inside a tab (e.g. Grow's Coach Session) hide the
// bottom tab bar while focused. The tab navigator's own setOptions is a no-op in this app's
// navigation shim (frontend/src/native/navigation.jsx), so SegmentedTabBar can't be reached
// through the normal React Navigation options API — this context is the escape hatch.
import { createContext, useContext, useState, type ReactNode } from "react";

const TabBarVisibilityCtx = createContext<{ hidden: boolean; setHidden: (hidden: boolean) => void } | null>(null);

export function TabBarVisibilityProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  return <TabBarVisibilityCtx.Provider value={{ hidden, setHidden }}>{children}</TabBarVisibilityCtx.Provider>;
}

export function useTabBarVisibility() {
  const ctx = useContext(TabBarVisibilityCtx);
  if (!ctx) throw new Error("useTabBarVisibility must be used within TabBarVisibilityProvider");
  return ctx;
}
