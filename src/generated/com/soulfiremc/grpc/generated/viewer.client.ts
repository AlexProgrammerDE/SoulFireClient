// @generated by protobuf-ts 2.9.4
// @generated from protobuf file "com/soulfiremc/grpc/generated/viewer.proto" (package "com.soulfiremc.grpc.generated", syntax proto3)
// tslint:disable
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { ServiceInfo } from "@protobuf-ts/runtime-rpc";
import { ViewerService } from "./viewer";
import type { ViewerDataResponse } from "./viewer";
import type { ViewerDataRequest } from "./viewer";
import type { ServerStreamingCall } from "@protobuf-ts/runtime-rpc";
import { stackIntercept } from "@protobuf-ts/runtime-rpc";
import type { ViewerListResponse } from "./viewer";
import type { ViewerListRequest } from "./viewer";
import type { UnaryCall } from "@protobuf-ts/runtime-rpc";
import type { RpcOptions } from "@protobuf-ts/runtime-rpc";
/**
 * @generated from protobuf service com.soulfiremc.grpc.generated.ViewerService
 */
export interface IViewerServiceClient {
    /**
     * @generated from protobuf rpc: listAvailable(com.soulfiremc.grpc.generated.ViewerListRequest) returns (com.soulfiremc.grpc.generated.ViewerListResponse);
     */
    listAvailable(input: ViewerListRequest, options?: RpcOptions): UnaryCall<ViewerListRequest, ViewerListResponse>;
    /**
     * @generated from protobuf rpc: subscribe(com.soulfiremc.grpc.generated.ViewerDataRequest) returns (stream com.soulfiremc.grpc.generated.ViewerDataResponse);
     */
    subscribe(input: ViewerDataRequest, options?: RpcOptions): ServerStreamingCall<ViewerDataRequest, ViewerDataResponse>;
}
/**
 * @generated from protobuf service com.soulfiremc.grpc.generated.ViewerService
 */
export class ViewerServiceClient implements IViewerServiceClient, ServiceInfo {
    typeName = ViewerService.typeName;
    methods = ViewerService.methods;
    options = ViewerService.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: listAvailable(com.soulfiremc.grpc.generated.ViewerListRequest) returns (com.soulfiremc.grpc.generated.ViewerListResponse);
     */
    listAvailable(input: ViewerListRequest, options?: RpcOptions): UnaryCall<ViewerListRequest, ViewerListResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<ViewerListRequest, ViewerListResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: subscribe(com.soulfiremc.grpc.generated.ViewerDataRequest) returns (stream com.soulfiremc.grpc.generated.ViewerDataResponse);
     */
    subscribe(input: ViewerDataRequest, options?: RpcOptions): ServerStreamingCall<ViewerDataRequest, ViewerDataResponse> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<ViewerDataRequest, ViewerDataResponse>("serverStreaming", this._transport, method, opt, input);
    }
}
