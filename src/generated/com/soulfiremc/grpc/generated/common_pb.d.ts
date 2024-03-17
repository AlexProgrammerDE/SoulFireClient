import * as jspb from 'google-protobuf'



export class ProxyProto extends jspb.Message {
  getType(): ProxyProto.Type;
  setType(value: ProxyProto.Type): ProxyProto;

  getHost(): string;
  setHost(value: string): ProxyProto;

  getPort(): number;
  setPort(value: number): ProxyProto;

  getUsername(): string;
  setUsername(value: string): ProxyProto;
  hasUsername(): boolean;
  clearUsername(): ProxyProto;

  getPassword(): string;
  setPassword(value: string): ProxyProto;
  hasPassword(): boolean;
  clearPassword(): ProxyProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ProxyProto.AsObject;
  static toObject(includeInstance: boolean, msg: ProxyProto): ProxyProto.AsObject;
  static serializeBinaryToWriter(message: ProxyProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ProxyProto;
  static deserializeBinaryFromReader(message: ProxyProto, reader: jspb.BinaryReader): ProxyProto;
}

export namespace ProxyProto {
  export type AsObject = {
    type: ProxyProto.Type,
    host: string,
    port: number,
    username?: string,
    password?: string,
  }

  export enum Type { 
    HTTP = 0,
    SOCKS4 = 1,
    SOCKS5 = 2,
  }

  export enum UsernameCase { 
    _USERNAME_NOT_SET = 0,
    USERNAME = 4,
  }

  export enum PasswordCase { 
    _PASSWORD_NOT_SET = 0,
    PASSWORD = 5,
  }
}

export class MinecraftAccountProto extends jspb.Message {
  getType(): MinecraftAccountProto.AccountTypeProto;
  setType(value: MinecraftAccountProto.AccountTypeProto): MinecraftAccountProto;

  getProfileid(): string;
  setProfileid(value: string): MinecraftAccountProto;

  getLastknownname(): string;
  setLastknownname(value: string): MinecraftAccountProto;

  getOnlinejavadata(): MinecraftAccountProto.OnlineJavaData | undefined;
  setOnlinejavadata(value?: MinecraftAccountProto.OnlineJavaData): MinecraftAccountProto;
  hasOnlinejavadata(): boolean;
  clearOnlinejavadata(): MinecraftAccountProto;

  getOfflinejavadata(): MinecraftAccountProto.OfflineJavaData | undefined;
  setOfflinejavadata(value?: MinecraftAccountProto.OfflineJavaData): MinecraftAccountProto;
  hasOfflinejavadata(): boolean;
  clearOfflinejavadata(): MinecraftAccountProto;

  getBedrockdata(): MinecraftAccountProto.BedrockData | undefined;
  setBedrockdata(value?: MinecraftAccountProto.BedrockData): MinecraftAccountProto;
  hasBedrockdata(): boolean;
  clearBedrockdata(): MinecraftAccountProto;

  getAccountdataCase(): MinecraftAccountProto.AccountdataCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MinecraftAccountProto.AsObject;
  static toObject(includeInstance: boolean, msg: MinecraftAccountProto): MinecraftAccountProto.AsObject;
  static serializeBinaryToWriter(message: MinecraftAccountProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MinecraftAccountProto;
  static deserializeBinaryFromReader(message: MinecraftAccountProto, reader: jspb.BinaryReader): MinecraftAccountProto;
}

export namespace MinecraftAccountProto {
  export type AsObject = {
    type: MinecraftAccountProto.AccountTypeProto,
    profileid: string,
    lastknownname: string,
    onlinejavadata?: MinecraftAccountProto.OnlineJavaData.AsObject,
    offlinejavadata?: MinecraftAccountProto.OfflineJavaData.AsObject,
    bedrockdata?: MinecraftAccountProto.BedrockData.AsObject,
  }

  export class OnlineJavaData extends jspb.Message {
    getAuthtoken(): string;
    setAuthtoken(value: string): OnlineJavaData;

    getTokenexpireat(): number;
    setTokenexpireat(value: number): OnlineJavaData;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): OnlineJavaData.AsObject;
    static toObject(includeInstance: boolean, msg: OnlineJavaData): OnlineJavaData.AsObject;
    static serializeBinaryToWriter(message: OnlineJavaData, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): OnlineJavaData;
    static deserializeBinaryFromReader(message: OnlineJavaData, reader: jspb.BinaryReader): OnlineJavaData;
  }

  export namespace OnlineJavaData {
    export type AsObject = {
      authtoken: string,
      tokenexpireat: number,
    }
  }


  export class OfflineJavaData extends jspb.Message {
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): OfflineJavaData.AsObject;
    static toObject(includeInstance: boolean, msg: OfflineJavaData): OfflineJavaData.AsObject;
    static serializeBinaryToWriter(message: OfflineJavaData, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): OfflineJavaData;
    static deserializeBinaryFromReader(message: OfflineJavaData, reader: jspb.BinaryReader): OfflineJavaData;
  }

  export namespace OfflineJavaData {
    export type AsObject = {
    }
  }


  export class BedrockData extends jspb.Message {
    getMojangjwt(): string;
    setMojangjwt(value: string): BedrockData;

    getIdentityjwt(): string;
    setIdentityjwt(value: string): BedrockData;

    getPublickey(): string;
    setPublickey(value: string): BedrockData;

    getPrivatekey(): string;
    setPrivatekey(value: string): BedrockData;

    getDeviceid(): string;
    setDeviceid(value: string): BedrockData;

    getPlayfabid(): string;
    setPlayfabid(value: string): BedrockData;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BedrockData.AsObject;
    static toObject(includeInstance: boolean, msg: BedrockData): BedrockData.AsObject;
    static serializeBinaryToWriter(message: BedrockData, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BedrockData;
    static deserializeBinaryFromReader(message: BedrockData, reader: jspb.BinaryReader): BedrockData;
  }

  export namespace BedrockData {
    export type AsObject = {
      mojangjwt: string,
      identityjwt: string,
      publickey: string,
      privatekey: string,
      deviceid: string,
      playfabid: string,
    }
  }


  export enum AccountTypeProto { 
    MICROSOFT_JAVA = 0,
    MICROSOFT_BEDROCK = 1,
    EASY_MC = 2,
    THE_ALTENING = 3,
    OFFLINE = 4,
  }

  export enum AccountdataCase { 
    ACCOUNTDATA_NOT_SET = 0,
    ONLINEJAVADATA = 4,
    OFFLINEJAVADATA = 5,
    BEDROCKDATA = 6,
  }
}

