import { createContext, useContext } from "react";
import type { FormSpec, Intent, Page, State } from "./types";
export type AppContextValue = {
  state: State;
  page: Page;
  navigate: (page: Page, intent?: Intent) => void;
  /** Set only when the current page was opened by a button with a target. */
  intent: Intent | null;
  act: (
    type: string,
    data?: Record<string, unknown>,
    message?: string
  ) => Promise<Record<string, unknown>>;
  openForm: (spec: FormSpec) => void;
  notify: (message: string) => void;
  refresh: () => Promise<void>;
  /** Admins only: load the portal as this member, read-only. "" exits. */
  viewAs: (memberId: string) => Promise<void>;
};
export const AppContext = createContext<AppContextValue | null>(null);
export function useApp() {
  const c = useContext(AppContext);
  if (!c) throw new Error("App context is missing");
  return c;
}
