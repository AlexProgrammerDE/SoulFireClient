import type { Transport } from "@connectrpc/connect";
import { createContext } from "react";

export const TransportContext = createContext<Transport | null>(null);
