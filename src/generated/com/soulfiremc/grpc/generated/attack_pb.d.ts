import * as jspb from 'google-protobuf'

import * as com_soulfiremc_grpc_generated_common_pb from '../../../../com/soulfiremc/grpc/generated/common_pb'; // proto import: "com/soulfiremc/grpc/generated/common.proto"


export class SettingsEntry extends jspb.Message {
  getKey(): string;
  setKey(value: string): SettingsEntry;

  getStringvalue(): string;
  setStringvalue(value: string): SettingsEntry;

  getIntvalue(): number;
  setIntvalue(value: number): SettingsEntry;

  getBoolvalue(): boolean;
  setBoolvalue(value: boolean): SettingsEntry;

  getDoublevalue(): number;
  setDoublevalue(value: number): SettingsEntry;

  getValueCase(): SettingsEntry.ValueCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SettingsEntry.AsObject;
  static toObject(includeInstance: boolean, msg: SettingsEntry): SettingsEntry.AsObject;
  static serializeBinaryToWriter(message: SettingsEntry, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SettingsEntry;
  static deserializeBinaryFromReader(message: SettingsEntry, reader: jspb.BinaryReader): SettingsEntry;
}

export namespace SettingsEntry {
  export type AsObject = {
    key: string,
    stringvalue: string,
    intvalue: number,
    boolvalue: boolean,
    doublevalue: number,
  }

  export enum ValueCase { 
    VALUE_NOT_SET = 0,
    STRINGVALUE = 2,
    INTVALUE = 3,
    BOOLVALUE = 4,
    DOUBLEVALUE = 5,
  }
}

export class SettingsNamespace extends jspb.Message {
  getNamespace(): string;
  setNamespace(value: string): SettingsNamespace;

  getEntriesList(): Array<SettingsEntry>;
  setEntriesList(value: Array<SettingsEntry>): SettingsNamespace;
  clearEntriesList(): SettingsNamespace;
  addEntries(value?: SettingsEntry, index?: number): SettingsEntry;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SettingsNamespace.AsObject;
  static toObject(includeInstance: boolean, msg: SettingsNamespace): SettingsNamespace.AsObject;
  static serializeBinaryToWriter(message: SettingsNamespace, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SettingsNamespace;
  static deserializeBinaryFromReader(message: SettingsNamespace, reader: jspb.BinaryReader): SettingsNamespace;
}

export namespace SettingsNamespace {
  export type AsObject = {
    namespace: string,
    entriesList: Array<SettingsEntry.AsObject>,
  }
}

export class AttackStartRequest extends jspb.Message {
  getSettingsList(): Array<SettingsNamespace>;
  setSettingsList(value: Array<SettingsNamespace>): AttackStartRequest;
  clearSettingsList(): AttackStartRequest;
  addSettings(value?: SettingsNamespace, index?: number): SettingsNamespace;

  getAccountsList(): Array<com_soulfiremc_grpc_generated_common_pb.MinecraftAccountProto>;
  setAccountsList(value: Array<com_soulfiremc_grpc_generated_common_pb.MinecraftAccountProto>): AttackStartRequest;
  clearAccountsList(): AttackStartRequest;
  addAccounts(value?: com_soulfiremc_grpc_generated_common_pb.MinecraftAccountProto, index?: number): com_soulfiremc_grpc_generated_common_pb.MinecraftAccountProto;

  getProxiesList(): Array<com_soulfiremc_grpc_generated_common_pb.ProxyProto>;
  setProxiesList(value: Array<com_soulfiremc_grpc_generated_common_pb.ProxyProto>): AttackStartRequest;
  clearProxiesList(): AttackStartRequest;
  addProxies(value?: com_soulfiremc_grpc_generated_common_pb.ProxyProto, index?: number): com_soulfiremc_grpc_generated_common_pb.ProxyProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AttackStartRequest.AsObject;
  static toObject(includeInstance: boolean, msg: AttackStartRequest): AttackStartRequest.AsObject;
  static serializeBinaryToWriter(message: AttackStartRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AttackStartRequest;
  static deserializeBinaryFromReader(message: AttackStartRequest, reader: jspb.BinaryReader): AttackStartRequest;
}

export namespace AttackStartRequest {
  export type AsObject = {
    settingsList: Array<SettingsNamespace.AsObject>,
    accountsList: Array<com_soulfiremc_grpc_generated_common_pb.MinecraftAccountProto.AsObject>,
    proxiesList: Array<com_soulfiremc_grpc_generated_common_pb.ProxyProto.AsObject>,
  }
}

export class AttackStartResponse extends jspb.Message {
  getId(): number;
  setId(value: number): AttackStartResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AttackStartResponse.AsObject;
  static toObject(includeInstance: boolean, msg: AttackStartResponse): AttackStartResponse.AsObject;
  static serializeBinaryToWriter(message: AttackStartResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AttackStartResponse;
  static deserializeBinaryFromReader(message: AttackStartResponse, reader: jspb.BinaryReader): AttackStartResponse;
}

export namespace AttackStartResponse {
  export type AsObject = {
    id: number,
  }
}

export class AttackStateToggleRequest extends jspb.Message {
  getId(): number;
  setId(value: number): AttackStateToggleRequest;

  getNewstate(): AttackStateToggleRequest.State;
  setNewstate(value: AttackStateToggleRequest.State): AttackStateToggleRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AttackStateToggleRequest.AsObject;
  static toObject(includeInstance: boolean, msg: AttackStateToggleRequest): AttackStateToggleRequest.AsObject;
  static serializeBinaryToWriter(message: AttackStateToggleRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AttackStateToggleRequest;
  static deserializeBinaryFromReader(message: AttackStateToggleRequest, reader: jspb.BinaryReader): AttackStateToggleRequest;
}

export namespace AttackStateToggleRequest {
  export type AsObject = {
    id: number,
    newstate: AttackStateToggleRequest.State,
  }

  export enum State { 
    PAUSE = 0,
    RESUME = 1,
  }
}

export class AttackStateToggleResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AttackStateToggleResponse.AsObject;
  static toObject(includeInstance: boolean, msg: AttackStateToggleResponse): AttackStateToggleResponse.AsObject;
  static serializeBinaryToWriter(message: AttackStateToggleResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AttackStateToggleResponse;
  static deserializeBinaryFromReader(message: AttackStateToggleResponse, reader: jspb.BinaryReader): AttackStateToggleResponse;
}

export namespace AttackStateToggleResponse {
  export type AsObject = {
  }
}

export class AttackStopRequest extends jspb.Message {
  getId(): number;
  setId(value: number): AttackStopRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AttackStopRequest.AsObject;
  static toObject(includeInstance: boolean, msg: AttackStopRequest): AttackStopRequest.AsObject;
  static serializeBinaryToWriter(message: AttackStopRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AttackStopRequest;
  static deserializeBinaryFromReader(message: AttackStopRequest, reader: jspb.BinaryReader): AttackStopRequest;
}

export namespace AttackStopRequest {
  export type AsObject = {
    id: number,
  }
}

export class AttackStopResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AttackStopResponse.AsObject;
  static toObject(includeInstance: boolean, msg: AttackStopResponse): AttackStopResponse.AsObject;
  static serializeBinaryToWriter(message: AttackStopResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AttackStopResponse;
  static deserializeBinaryFromReader(message: AttackStopResponse, reader: jspb.BinaryReader): AttackStopResponse;
}

export namespace AttackStopResponse {
  export type AsObject = {
  }
}

