import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import { createContext } from "react";

export const TransportContext = createContext<RpcTransport | null>(null);
