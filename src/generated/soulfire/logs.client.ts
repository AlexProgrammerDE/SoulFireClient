/* eslint-disable */
// @generated by protobuf-ts 2.11.1 with parameter long_type_string,optimize_code_size,eslint_disable,ts_nocheck
// @generated from protobuf file "soulfire/logs.proto" (package "soulfire.v1", syntax proto3)
// tslint:disable
// @ts-nocheck
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { ServiceInfo } from "@protobuf-ts/runtime-rpc";
import { LogsService } from "./logs";
import type { LogResponse } from "./logs";
import type { LogRequest } from "./logs";
import type { ServerStreamingCall } from "@protobuf-ts/runtime-rpc";
import { stackIntercept } from "@protobuf-ts/runtime-rpc";
import type { PreviousLogResponse } from "./logs";
import type { PreviousLogRequest } from "./logs";
import type { UnaryCall } from "@protobuf-ts/runtime-rpc";
import type { RpcOptions } from "@protobuf-ts/runtime-rpc";
/**
 * @generated from protobuf service soulfire.v1.LogsService
 */
export interface ILogsServiceClient {
    /**
     * @generated from protobuf rpc: GetPrevious
     */
    getPrevious(input: PreviousLogRequest, options?: RpcOptions): UnaryCall<PreviousLogRequest, PreviousLogResponse>;
    /**
     * @generated from protobuf rpc: Subscribe
     */
    subscribe(input: LogRequest, options?: RpcOptions): ServerStreamingCall<LogRequest, LogResponse>;
}
/**
 * @generated from protobuf service soulfire.v1.LogsService
 */
export class LogsServiceClient implements ILogsServiceClient, ServiceInfo {
    typeName = LogsService.typeName;
    methods = LogsService.methods;
    options = LogsService.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: GetPrevious
     */
    getPrevious(input: PreviousLogRequest, options?: RpcOptions): UnaryCall<PreviousLogRequest, PreviousLogResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<PreviousLogRequest, PreviousLogResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: Subscribe
     */
    subscribe(input: LogRequest, options?: RpcOptions): ServerStreamingCall<LogRequest, LogResponse> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<LogRequest, LogResponse>("serverStreaming", this._transport, method, opt, input);
    }
}
