import * as jspb from 'google-protobuf'

import * as com_soulfiremc_grpc_generated_common_pb from '../../../../com/soulfiremc/grpc/generated/common_pb'; // proto import: "com/soulfiremc/grpc/generated/common.proto"


export class AuthRequest extends jspb.Message {
  getService(): com_soulfiremc_grpc_generated_common_pb.MinecraftAccountProto.AccountTypeProto;
  setService(value: com_soulfiremc_grpc_generated_common_pb.MinecraftAccountProto.AccountTypeProto): AuthRequest;

  getProxy(): com_soulfiremc_grpc_generated_common_pb.ProxyProto | undefined;
  setProxy(value?: com_soulfiremc_grpc_generated_common_pb.ProxyProto): AuthRequest;
  hasProxy(): boolean;
  clearProxy(): AuthRequest;

  getPayload(): string;
  setPayload(value: string): AuthRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AuthRequest.AsObject;
  static toObject(includeInstance: boolean, msg: AuthRequest): AuthRequest.AsObject;
  static serializeBinaryToWriter(message: AuthRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AuthRequest;
  static deserializeBinaryFromReader(message: AuthRequest, reader: jspb.BinaryReader): AuthRequest;
}

export namespace AuthRequest {
  export type AsObject = {
    service: com_soulfiremc_grpc_generated_common_pb.MinecraftAccountProto.AccountTypeProto,
    proxy?: com_soulfiremc_grpc_generated_common_pb.ProxyProto.AsObject,
    payload: string,
  }

  export enum ProxyCase { 
    _PROXY_NOT_SET = 0,
    PROXY = 2,
  }
}

export class AuthResponse extends jspb.Message {
  getAccount(): com_soulfiremc_grpc_generated_common_pb.MinecraftAccountProto | undefined;
  setAccount(value?: com_soulfiremc_grpc_generated_common_pb.MinecraftAccountProto): AuthResponse;
  hasAccount(): boolean;
  clearAccount(): AuthResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AuthResponse.AsObject;
  static toObject(includeInstance: boolean, msg: AuthResponse): AuthResponse.AsObject;
  static serializeBinaryToWriter(message: AuthResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AuthResponse;
  static deserializeBinaryFromReader(message: AuthResponse, reader: jspb.BinaryReader): AuthResponse;
}

export namespace AuthResponse {
  export type AsObject = {
    account?: com_soulfiremc_grpc_generated_common_pb.MinecraftAccountProto.AsObject,
  }
}

