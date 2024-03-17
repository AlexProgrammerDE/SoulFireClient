import {createContext} from "react";
import grpcWeb from "grpc-web";

export type ServerConnectionInfo = {
    address: string
    token: string

    createMetadata: () => grpcWeb.Metadata
}

export const ServerConnectionContext = createContext<ServerConnectionInfo | null>(null)
