import { createContext } from "react";

export const TerminalThemeContext = createContext<{
  value: string;
  setter: (value: string) => void;
}>(null as never);
