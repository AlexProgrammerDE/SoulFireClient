import * as jspb from 'google-protobuf'

import * as com_soulfiremc_grpc_generated_common_pb from '../../../../com/soulfiremc/grpc/generated/common_pb'; // proto import: "com/soulfiremc/grpc/generated/common.proto"


export class ProxyCheckRequest extends jspb.Message {
  getProxyList(): Array<com_soulfiremc_grpc_generated_common_pb.ProxyProto>;
  setProxyList(value: Array<com_soulfiremc_grpc_generated_common_pb.ProxyProto>): ProxyCheckRequest;
  clearProxyList(): ProxyCheckRequest;
  addProxy(value?: com_soulfiremc_grpc_generated_common_pb.ProxyProto, index?: number): com_soulfiremc_grpc_generated_common_pb.ProxyProto;

  getTarget(): ProxyCheckRequest.Target;
  setTarget(value: ProxyCheckRequest.Target): ProxyCheckRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ProxyCheckRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ProxyCheckRequest): ProxyCheckRequest.AsObject;
  static serializeBinaryToWriter(message: ProxyCheckRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ProxyCheckRequest;
  static deserializeBinaryFromReader(message: ProxyCheckRequest, reader: jspb.BinaryReader): ProxyCheckRequest;
}

export namespace ProxyCheckRequest {
  export type AsObject = {
    proxyList: Array<com_soulfiremc_grpc_generated_common_pb.ProxyProto.AsObject>,
    target: ProxyCheckRequest.Target,
  }

  export enum Target { 
    IPIFY = 0,
    AWS = 1,
  }
}

export class ProxyCheckResponseSingle extends jspb.Message {
  getProxy(): com_soulfiremc_grpc_generated_common_pb.ProxyProto | undefined;
  setProxy(value?: com_soulfiremc_grpc_generated_common_pb.ProxyProto): ProxyCheckResponseSingle;
  hasProxy(): boolean;
  clearProxy(): ProxyCheckResponseSingle;

  getValid(): boolean;
  setValid(value: boolean): ProxyCheckResponseSingle;

  getLatency(): number;
  setLatency(value: number): ProxyCheckResponseSingle;

  getRealip(): string;
  setRealip(value: string): ProxyCheckResponseSingle;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ProxyCheckResponseSingle.AsObject;
  static toObject(includeInstance: boolean, msg: ProxyCheckResponseSingle): ProxyCheckResponseSingle.AsObject;
  static serializeBinaryToWriter(message: ProxyCheckResponseSingle, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ProxyCheckResponseSingle;
  static deserializeBinaryFromReader(message: ProxyCheckResponseSingle, reader: jspb.BinaryReader): ProxyCheckResponseSingle;
}

export namespace ProxyCheckResponseSingle {
  export type AsObject = {
    proxy?: com_soulfiremc_grpc_generated_common_pb.ProxyProto.AsObject,
    valid: boolean,
    latency: number,
    realip: string,
  }
}

export class ProxyCheckResponse extends jspb.Message {
  getResponseList(): Array<ProxyCheckResponseSingle>;
  setResponseList(value: Array<ProxyCheckResponseSingle>): ProxyCheckResponse;
  clearResponseList(): ProxyCheckResponse;
  addResponse(value?: ProxyCheckResponseSingle, index?: number): ProxyCheckResponseSingle;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ProxyCheckResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ProxyCheckResponse): ProxyCheckResponse.AsObject;
  static serializeBinaryToWriter(message: ProxyCheckResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ProxyCheckResponse;
  static deserializeBinaryFromReader(message: ProxyCheckResponse, reader: jspb.BinaryReader): ProxyCheckResponse;
}

export namespace ProxyCheckResponse {
  export type AsObject = {
    responseList: Array<ProxyCheckResponseSingle.AsObject>,
  }
}

