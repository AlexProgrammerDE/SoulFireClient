/* eslint-disable */
// @generated by protobuf-ts 2.11.1 with parameter long_type_string,optimize_code_size,eslint_disable,ts_nocheck
// @generated from protobuf file "soulfire/server.proto" (package "soulfire.v1", syntax proto3)
// tslint:disable
// @ts-nocheck
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { ServiceInfo } from "@protobuf-ts/runtime-rpc";
import { ServerService } from "./server";
import type { ServerUpdateConfigResponse } from "./server";
import type { ServerUpdateConfigRequest } from "./server";
import { stackIntercept } from "@protobuf-ts/runtime-rpc";
import type { ServerInfoResponse } from "./server";
import type { ServerInfoRequest } from "./server";
import type { UnaryCall } from "@protobuf-ts/runtime-rpc";
import type { RpcOptions } from "@protobuf-ts/runtime-rpc";
/**
 * @generated from protobuf service soulfire.v1.ServerService
 */
export interface IServerServiceClient {
    /**
     * @generated from protobuf rpc: GetServerInfo
     */
    getServerInfo(input: ServerInfoRequest, options?: RpcOptions): UnaryCall<ServerInfoRequest, ServerInfoResponse>;
    /**
     * @generated from protobuf rpc: UpdateServerConfig
     */
    updateServerConfig(input: ServerUpdateConfigRequest, options?: RpcOptions): UnaryCall<ServerUpdateConfigRequest, ServerUpdateConfigResponse>;
}
/**
 * @generated from protobuf service soulfire.v1.ServerService
 */
export class ServerServiceClient implements IServerServiceClient, ServiceInfo {
    typeName = ServerService.typeName;
    methods = ServerService.methods;
    options = ServerService.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: GetServerInfo
     */
    getServerInfo(input: ServerInfoRequest, options?: RpcOptions): UnaryCall<ServerInfoRequest, ServerInfoResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<ServerInfoRequest, ServerInfoResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: UpdateServerConfig
     */
    updateServerConfig(input: ServerUpdateConfigRequest, options?: RpcOptions): UnaryCall<ServerUpdateConfigRequest, ServerUpdateConfigResponse> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<ServerUpdateConfigRequest, ServerUpdateConfigResponse>("unary", this._transport, method, opt, input);
    }
}
