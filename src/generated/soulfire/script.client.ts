/* eslint-disable */
// @generated by protobuf-ts 2.11.1 with parameter long_type_string,optimize_code_size,eslint_disable,ts_nocheck
// @generated from protobuf file "soulfire/script.proto" (package "soulfire.v1", syntax proto3)
// tslint:disable
// @ts-nocheck
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { ServiceInfo } from "@protobuf-ts/runtime-rpc";
import { ScriptService } from "./script";
import type { ScriptListResponse } from "./script";
import type { ScriptListRequest } from "./script";
import type { UpdateScriptResponse } from "./script";
import type { UpdateScriptRequest } from "./script";
import type { RestartScriptResponse } from "./script";
import type { RestartScriptRequest } from "./script";
import type { DeleteScriptResponse } from "./script";
import type { DeleteScriptRequest } from "./script";
import { stackIntercept } from "@protobuf-ts/runtime-rpc";
import type { CreateScriptResponse } from "./script";
import type { CreateScriptRequest } from "./script";
import type { UnaryCall } from "@protobuf-ts/runtime-rpc";
import type { RpcOptions } from "@protobuf-ts/runtime-rpc";
/**
 * @generated from protobuf service soulfire.v1.ScriptService
 */
export interface IScriptServiceClient {
    /**
     * @generated from protobuf rpc: CreateScript
     */
    createScript(input: CreateScriptRequest, options?: RpcOptions): UnaryCall<CreateScriptRequest, CreateScriptResponse>;
    /**
     * @generated from protobuf rpc: DeleteScript
     */
    deleteScript(input: DeleteScriptRequest, options?: RpcOptions): UnaryCall<DeleteScriptRequest, DeleteScriptResponse>;
    /**
     * @generated from protobuf rpc: RestartScript
     */
    restartScript(input: RestartScriptRequest, options?: RpcOptions): UnaryCall<RestartScriptRequest, RestartScriptResponse>;
    /**
     * @generated from protobuf rpc: UpdateScript
     */
    updateScript(input: UpdateScriptRequest, options?: RpcOptions): UnaryCall<UpdateScriptRequest, UpdateScriptResponse>;
    /**
     * @generated from protobuf rpc: ListScripts
     */
    listScripts(input: ScriptListRequest, options?: RpcOptions): UnaryCall<ScriptListRequest, ScriptListResponse>;
}
/**
 * @generated from protobuf service soulfire.v1.ScriptService
 */
export class ScriptServiceClient implements IScriptServiceClient, ServiceInfo {
    typeName = ScriptService.typeName;
    methods = ScriptService.methods;
    options = ScriptService.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: CreateScript
     */
    createScript(input: CreateScriptRequest, options?: RpcOptions): UnaryCall<CreateScriptRequest, CreateScriptResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<CreateScriptRequest, CreateScriptResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: DeleteScript
     */
    deleteScript(input: DeleteScriptRequest, options?: RpcOptions): UnaryCall<DeleteScriptRequest, DeleteScriptResponse> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<DeleteScriptRequest, DeleteScriptResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: RestartScript
     */
    restartScript(input: RestartScriptRequest, options?: RpcOptions): UnaryCall<RestartScriptRequest, RestartScriptResponse> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
        return stackIntercept<RestartScriptRequest, RestartScriptResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: UpdateScript
     */
    updateScript(input: UpdateScriptRequest, options?: RpcOptions): UnaryCall<UpdateScriptRequest, UpdateScriptResponse> {
        const method = this.methods[3], opt = this._transport.mergeOptions(options);
        return stackIntercept<UpdateScriptRequest, UpdateScriptResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: ListScripts
     */
    listScripts(input: ScriptListRequest, options?: RpcOptions): UnaryCall<ScriptListRequest, ScriptListResponse> {
        const method = this.methods[4], opt = this._transport.mergeOptions(options);
        return stackIntercept<ScriptListRequest, ScriptListResponse>("unary", this._transport, method, opt, input);
    }
}
