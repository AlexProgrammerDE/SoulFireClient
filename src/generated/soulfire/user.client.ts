// @generated by protobuf-ts 2.9.4 with parameter long_type_string,optimize_code_size
// @generated from protobuf file "soulfire/user.proto" (package "soulfire.v1", syntax proto3)
// tslint:disable
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { ServiceInfo } from "@protobuf-ts/runtime-rpc";
import { UserService } from "./user";
import type { UserInfoResponse } from "./user";
import type { UserInfoRequest } from "./user";
import type { UserListResponse } from "./user";
import type { UserListRequest } from "./user";
import type { UserDeleteResponse } from "./user";
import type { UserDeleteRequest } from "./user";
import { stackIntercept } from "@protobuf-ts/runtime-rpc";
import type { UserCreateResponse } from "./user";
import type { UserCreateRequest } from "./user";
import type { UnaryCall } from "@protobuf-ts/runtime-rpc";
import type { RpcOptions } from "@protobuf-ts/runtime-rpc";
/**
 * @generated from protobuf service soulfire.v1.UserService
 */
export interface IUserServiceClient {
    /**
     * @generated from protobuf rpc: createUser(soulfire.v1.UserCreateRequest) returns (soulfire.v1.UserCreateResponse);
     */
    createUser(input: UserCreateRequest, options?: RpcOptions): UnaryCall<UserCreateRequest, UserCreateResponse>;
    /**
     * @generated from protobuf rpc: deleteUser(soulfire.v1.UserDeleteRequest) returns (soulfire.v1.UserDeleteResponse);
     */
    deleteUser(input: UserDeleteRequest, options?: RpcOptions): UnaryCall<UserDeleteRequest, UserDeleteResponse>;
    /**
     * @generated from protobuf rpc: listUsers(soulfire.v1.UserListRequest) returns (soulfire.v1.UserListResponse);
     */
    listUsers(input: UserListRequest, options?: RpcOptions): UnaryCall<UserListRequest, UserListResponse>;
    /**
     * @generated from protobuf rpc: getUserInfo(soulfire.v1.UserInfoRequest) returns (soulfire.v1.UserInfoResponse);
     */
    getUserInfo(input: UserInfoRequest, options?: RpcOptions): UnaryCall<UserInfoRequest, UserInfoResponse>;
}
/**
 * @generated from protobuf service soulfire.v1.UserService
 */
export class UserServiceClient implements IUserServiceClient, ServiceInfo {
    typeName = UserService.typeName;
    methods = UserService.methods;
    options = UserService.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: createUser(soulfire.v1.UserCreateRequest) returns (soulfire.v1.UserCreateResponse);
     */
    createUser(input: UserCreateRequest, options?: RpcOptions): UnaryCall<UserCreateRequest, UserCreateResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<UserCreateRequest, UserCreateResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: deleteUser(soulfire.v1.UserDeleteRequest) returns (soulfire.v1.UserDeleteResponse);
     */
    deleteUser(input: UserDeleteRequest, options?: RpcOptions): UnaryCall<UserDeleteRequest, UserDeleteResponse> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<UserDeleteRequest, UserDeleteResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: listUsers(soulfire.v1.UserListRequest) returns (soulfire.v1.UserListResponse);
     */
    listUsers(input: UserListRequest, options?: RpcOptions): UnaryCall<UserListRequest, UserListResponse> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
        return stackIntercept<UserListRequest, UserListResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: getUserInfo(soulfire.v1.UserInfoRequest) returns (soulfire.v1.UserInfoResponse);
     */
    getUserInfo(input: UserInfoRequest, options?: RpcOptions): UnaryCall<UserInfoRequest, UserInfoResponse> {
        const method = this.methods[3], opt = this._transport.mergeOptions(options);
        return stackIntercept<UserInfoRequest, UserInfoResponse>("unary", this._transport, method, opt, input);
    }
}