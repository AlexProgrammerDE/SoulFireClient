import {createContext} from "react";
import {UIClientDataResponse} from "@/generated/com/soulfiremc/grpc/generated/config.ts";

export const ClientInfoContext = createContext<UIClientDataResponse>(null as never)
