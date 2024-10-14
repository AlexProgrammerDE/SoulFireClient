// @generated by protobuf-ts 2.9.4 with parameter long_type_string,optimize_code_size
// @generated from protobuf file "soulfire/download.proto" (package "soulfire.v1", syntax proto3)
// tslint:disable
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { ServiceInfo } from "@protobuf-ts/runtime-rpc";
import { DownloadService } from "./download";
import { stackIntercept } from "@protobuf-ts/runtime-rpc";
import type { DownloadResponse } from "./download";
import type { DownloadRequest } from "./download";
import type { UnaryCall } from "@protobuf-ts/runtime-rpc";
import type { RpcOptions } from "@protobuf-ts/runtime-rpc";
/**
 * @generated from protobuf service soulfire.v1.DownloadService
 */
export interface IDownloadServiceClient {
    /**
     * @generated from protobuf rpc: download(soulfire.v1.DownloadRequest) returns (soulfire.v1.DownloadResponse);
     */
    download(input: DownloadRequest, options?: RpcOptions): UnaryCall<DownloadRequest, DownloadResponse>;
}
/**
 * @generated from protobuf service soulfire.v1.DownloadService
 */
export class DownloadServiceClient implements IDownloadServiceClient, ServiceInfo {
    typeName = DownloadService.typeName;
    methods = DownloadService.methods;
    options = DownloadService.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: download(soulfire.v1.DownloadRequest) returns (soulfire.v1.DownloadResponse);
     */
    download(input: DownloadRequest, options?: RpcOptions): UnaryCall<DownloadRequest, DownloadResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<DownloadRequest, DownloadResponse>("unary", this._transport, method, opt, input);
    }
}