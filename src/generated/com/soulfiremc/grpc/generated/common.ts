// @generated by protobuf-ts 2.9.4
// @generated from protobuf file "com/soulfiremc/grpc/generated/common.proto" (package "com.soulfiremc.grpc.generated", syntax proto3)
// tslint:disable
import type { BinaryWriteOptions } from "@protobuf-ts/runtime";
import type { IBinaryWriter } from "@protobuf-ts/runtime";
import { WireType } from "@protobuf-ts/runtime";
import type { BinaryReadOptions } from "@protobuf-ts/runtime";
import type { IBinaryReader } from "@protobuf-ts/runtime";
import { UnknownFieldHandler } from "@protobuf-ts/runtime";
import type { PartialMessage } from "@protobuf-ts/runtime";
import { reflectionMergePartial } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
/**
 * @generated from protobuf message com.soulfiremc.grpc.generated.ProxyProto
 */
export interface ProxyProto {
    /**
     * @generated from protobuf field: com.soulfiremc.grpc.generated.ProxyProto.Type type = 1;
     */
    type: ProxyProto_Type;
    /**
     * @generated from protobuf field: string host = 2;
     */
    host: string;
    /**
     * @generated from protobuf field: int32 port = 3;
     */
    port: number;
    /**
     * @generated from protobuf field: optional string username = 4;
     */
    username?: string;
    /**
     * @generated from protobuf field: optional string password = 5;
     */
    password?: string;
}
/**
 * @generated from protobuf enum com.soulfiremc.grpc.generated.ProxyProto.Type
 */
export enum ProxyProto_Type {
    /**
     * @generated from protobuf enum value: HTTP = 0;
     */
    HTTP = 0,
    /**
     * @generated from protobuf enum value: SOCKS4 = 1;
     */
    SOCKS4 = 1,
    /**
     * @generated from protobuf enum value: SOCKS5 = 2;
     */
    SOCKS5 = 2
}
/**
 * @generated from protobuf message com.soulfiremc.grpc.generated.MinecraftAccountProto
 */
export interface MinecraftAccountProto {
    /**
     * @generated from protobuf field: com.soulfiremc.grpc.generated.MinecraftAccountProto.AccountTypeProto type = 1;
     */
    type: MinecraftAccountProto_AccountTypeProto;
    /**
     * @generated from protobuf field: string profileId = 2;
     */
    profileId: string;
    /**
     * @generated from protobuf field: string lastKnownName = 3;
     */
    lastKnownName: string;
    /**
     * @generated from protobuf oneof: accountData
     */
    accountData: {
        oneofKind: "onlineJavaData";
        /**
         * @generated from protobuf field: com.soulfiremc.grpc.generated.MinecraftAccountProto.OnlineJavaData onlineJavaData = 4;
         */
        onlineJavaData: MinecraftAccountProto_OnlineJavaData;
    } | {
        oneofKind: "offlineJavaData";
        /**
         * @generated from protobuf field: com.soulfiremc.grpc.generated.MinecraftAccountProto.OfflineJavaData offlineJavaData = 5;
         */
        offlineJavaData: MinecraftAccountProto_OfflineJavaData;
    } | {
        oneofKind: "bedrockData";
        /**
         * @generated from protobuf field: com.soulfiremc.grpc.generated.MinecraftAccountProto.BedrockData bedrockData = 6;
         */
        bedrockData: MinecraftAccountProto_BedrockData;
    } | {
        oneofKind: undefined;
    };
}
/**
 * @generated from protobuf message com.soulfiremc.grpc.generated.MinecraftAccountProto.OnlineJavaData
 */
export interface MinecraftAccountProto_OnlineJavaData {
    /**
     * @generated from protobuf field: string authToken = 1;
     */
    authToken: string;
    /**
     * @generated from protobuf field: int64 tokenExpireAt = 2;
     */
    tokenExpireAt: bigint;
}
/**
 * @generated from protobuf message com.soulfiremc.grpc.generated.MinecraftAccountProto.OfflineJavaData
 */
export interface MinecraftAccountProto_OfflineJavaData {
}
/**
 * @generated from protobuf message com.soulfiremc.grpc.generated.MinecraftAccountProto.BedrockData
 */
export interface MinecraftAccountProto_BedrockData {
    /**
     * @generated from protobuf field: string mojangJwt = 1;
     */
    mojangJwt: string;
    /**
     * @generated from protobuf field: string identityJwt = 2;
     */
    identityJwt: string;
    /**
     * @generated from protobuf field: string publicKey = 3;
     */
    publicKey: string;
    /**
     * @generated from protobuf field: string privateKey = 4;
     */
    privateKey: string;
    /**
     * @generated from protobuf field: string deviceId = 5;
     */
    deviceId: string;
    /**
     * @generated from protobuf field: string playFabId = 6;
     */
    playFabId: string;
}
/**
 * @generated from protobuf enum com.soulfiremc.grpc.generated.MinecraftAccountProto.AccountTypeProto
 */
export enum MinecraftAccountProto_AccountTypeProto {
    /**
     * @generated from protobuf enum value: MICROSOFT_JAVA = 0;
     */
    MICROSOFT_JAVA = 0,
    /**
     * @generated from protobuf enum value: MICROSOFT_BEDROCK = 1;
     */
    MICROSOFT_BEDROCK = 1,
    /**
     * @generated from protobuf enum value: EASY_MC = 2;
     */
    EASY_MC = 2,
    /**
     * @generated from protobuf enum value: THE_ALTENING = 3;
     */
    THE_ALTENING = 3,
    /**
     * @generated from protobuf enum value: OFFLINE = 4;
     */
    OFFLINE = 4
}
// @generated message type with reflection information, may provide speed optimized methods
class ProxyProto$Type extends MessageType<ProxyProto> {
    constructor() {
        super("com.soulfiremc.grpc.generated.ProxyProto", [
            { no: 1, name: "type", kind: "enum", T: () => ["com.soulfiremc.grpc.generated.ProxyProto.Type", ProxyProto_Type] },
            { no: 2, name: "host", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "port", kind: "scalar", T: 5 /*ScalarType.INT32*/ },
            { no: 4, name: "username", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "password", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<ProxyProto>): ProxyProto {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.type = 0;
        message.host = "";
        message.port = 0;
        if (value !== undefined)
            reflectionMergePartial<ProxyProto>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ProxyProto): ProxyProto {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* com.soulfiremc.grpc.generated.ProxyProto.Type type */ 1:
                    message.type = reader.int32();
                    break;
                case /* string host */ 2:
                    message.host = reader.string();
                    break;
                case /* int32 port */ 3:
                    message.port = reader.int32();
                    break;
                case /* optional string username */ 4:
                    message.username = reader.string();
                    break;
                case /* optional string password */ 5:
                    message.password = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: ProxyProto, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* com.soulfiremc.grpc.generated.ProxyProto.Type type = 1; */
        if (message.type !== 0)
            writer.tag(1, WireType.Varint).int32(message.type);
        /* string host = 2; */
        if (message.host !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.host);
        /* int32 port = 3; */
        if (message.port !== 0)
            writer.tag(3, WireType.Varint).int32(message.port);
        /* optional string username = 4; */
        if (message.username !== undefined)
            writer.tag(4, WireType.LengthDelimited).string(message.username);
        /* optional string password = 5; */
        if (message.password !== undefined)
            writer.tag(5, WireType.LengthDelimited).string(message.password);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message com.soulfiremc.grpc.generated.ProxyProto
 */
export const ProxyProto = new ProxyProto$Type();
// @generated message type with reflection information, may provide speed optimized methods
class MinecraftAccountProto$Type extends MessageType<MinecraftAccountProto> {
    constructor() {
        super("com.soulfiremc.grpc.generated.MinecraftAccountProto", [
            { no: 1, name: "type", kind: "enum", T: () => ["com.soulfiremc.grpc.generated.MinecraftAccountProto.AccountTypeProto", MinecraftAccountProto_AccountTypeProto] },
            { no: 2, name: "profileId", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "lastKnownName", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "onlineJavaData", kind: "message", oneof: "accountData", T: () => MinecraftAccountProto_OnlineJavaData },
            { no: 5, name: "offlineJavaData", kind: "message", oneof: "accountData", T: () => MinecraftAccountProto_OfflineJavaData },
            { no: 6, name: "bedrockData", kind: "message", oneof: "accountData", T: () => MinecraftAccountProto_BedrockData }
        ]);
    }
    create(value?: PartialMessage<MinecraftAccountProto>): MinecraftAccountProto {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.type = 0;
        message.profileId = "";
        message.lastKnownName = "";
        message.accountData = { oneofKind: undefined };
        if (value !== undefined)
            reflectionMergePartial<MinecraftAccountProto>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: MinecraftAccountProto): MinecraftAccountProto {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* com.soulfiremc.grpc.generated.MinecraftAccountProto.AccountTypeProto type */ 1:
                    message.type = reader.int32();
                    break;
                case /* string profileId */ 2:
                    message.profileId = reader.string();
                    break;
                case /* string lastKnownName */ 3:
                    message.lastKnownName = reader.string();
                    break;
                case /* com.soulfiremc.grpc.generated.MinecraftAccountProto.OnlineJavaData onlineJavaData */ 4:
                    message.accountData = {
                        oneofKind: "onlineJavaData",
                        onlineJavaData: MinecraftAccountProto_OnlineJavaData.internalBinaryRead(reader, reader.uint32(), options, (message.accountData as any).onlineJavaData)
                    };
                    break;
                case /* com.soulfiremc.grpc.generated.MinecraftAccountProto.OfflineJavaData offlineJavaData */ 5:
                    message.accountData = {
                        oneofKind: "offlineJavaData",
                        offlineJavaData: MinecraftAccountProto_OfflineJavaData.internalBinaryRead(reader, reader.uint32(), options, (message.accountData as any).offlineJavaData)
                    };
                    break;
                case /* com.soulfiremc.grpc.generated.MinecraftAccountProto.BedrockData bedrockData */ 6:
                    message.accountData = {
                        oneofKind: "bedrockData",
                        bedrockData: MinecraftAccountProto_BedrockData.internalBinaryRead(reader, reader.uint32(), options, (message.accountData as any).bedrockData)
                    };
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: MinecraftAccountProto, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* com.soulfiremc.grpc.generated.MinecraftAccountProto.AccountTypeProto type = 1; */
        if (message.type !== 0)
            writer.tag(1, WireType.Varint).int32(message.type);
        /* string profileId = 2; */
        if (message.profileId !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.profileId);
        /* string lastKnownName = 3; */
        if (message.lastKnownName !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.lastKnownName);
        /* com.soulfiremc.grpc.generated.MinecraftAccountProto.OnlineJavaData onlineJavaData = 4; */
        if (message.accountData.oneofKind === "onlineJavaData")
            MinecraftAccountProto_OnlineJavaData.internalBinaryWrite(message.accountData.onlineJavaData, writer.tag(4, WireType.LengthDelimited).fork(), options).join();
        /* com.soulfiremc.grpc.generated.MinecraftAccountProto.OfflineJavaData offlineJavaData = 5; */
        if (message.accountData.oneofKind === "offlineJavaData")
            MinecraftAccountProto_OfflineJavaData.internalBinaryWrite(message.accountData.offlineJavaData, writer.tag(5, WireType.LengthDelimited).fork(), options).join();
        /* com.soulfiremc.grpc.generated.MinecraftAccountProto.BedrockData bedrockData = 6; */
        if (message.accountData.oneofKind === "bedrockData")
            MinecraftAccountProto_BedrockData.internalBinaryWrite(message.accountData.bedrockData, writer.tag(6, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message com.soulfiremc.grpc.generated.MinecraftAccountProto
 */
export const MinecraftAccountProto = new MinecraftAccountProto$Type();
// @generated message type with reflection information, may provide speed optimized methods
class MinecraftAccountProto_OnlineJavaData$Type extends MessageType<MinecraftAccountProto_OnlineJavaData> {
    constructor() {
        super("com.soulfiremc.grpc.generated.MinecraftAccountProto.OnlineJavaData", [
            { no: 1, name: "authToken", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "tokenExpireAt", kind: "scalar", T: 3 /*ScalarType.INT64*/, L: 0 /*LongType.BIGINT*/ }
        ]);
    }
    create(value?: PartialMessage<MinecraftAccountProto_OnlineJavaData>): MinecraftAccountProto_OnlineJavaData {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.authToken = "";
        message.tokenExpireAt = 0n;
        if (value !== undefined)
            reflectionMergePartial<MinecraftAccountProto_OnlineJavaData>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: MinecraftAccountProto_OnlineJavaData): MinecraftAccountProto_OnlineJavaData {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string authToken */ 1:
                    message.authToken = reader.string();
                    break;
                case /* int64 tokenExpireAt */ 2:
                    message.tokenExpireAt = reader.int64().toBigInt();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: MinecraftAccountProto_OnlineJavaData, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string authToken = 1; */
        if (message.authToken !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.authToken);
        /* int64 tokenExpireAt = 2; */
        if (message.tokenExpireAt !== 0n)
            writer.tag(2, WireType.Varint).int64(message.tokenExpireAt);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message com.soulfiremc.grpc.generated.MinecraftAccountProto.OnlineJavaData
 */
export const MinecraftAccountProto_OnlineJavaData = new MinecraftAccountProto_OnlineJavaData$Type();
// @generated message type with reflection information, may provide speed optimized methods
class MinecraftAccountProto_OfflineJavaData$Type extends MessageType<MinecraftAccountProto_OfflineJavaData> {
    constructor() {
        super("com.soulfiremc.grpc.generated.MinecraftAccountProto.OfflineJavaData", []);
    }
    create(value?: PartialMessage<MinecraftAccountProto_OfflineJavaData>): MinecraftAccountProto_OfflineJavaData {
        const message = globalThis.Object.create((this.messagePrototype!));
        if (value !== undefined)
            reflectionMergePartial<MinecraftAccountProto_OfflineJavaData>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: MinecraftAccountProto_OfflineJavaData): MinecraftAccountProto_OfflineJavaData {
        return target ?? this.create();
    }
    internalBinaryWrite(message: MinecraftAccountProto_OfflineJavaData, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message com.soulfiremc.grpc.generated.MinecraftAccountProto.OfflineJavaData
 */
export const MinecraftAccountProto_OfflineJavaData = new MinecraftAccountProto_OfflineJavaData$Type();
// @generated message type with reflection information, may provide speed optimized methods
class MinecraftAccountProto_BedrockData$Type extends MessageType<MinecraftAccountProto_BedrockData> {
    constructor() {
        super("com.soulfiremc.grpc.generated.MinecraftAccountProto.BedrockData", [
            { no: 1, name: "mojangJwt", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "identityJwt", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "publicKey", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "privateKey", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "deviceId", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 6, name: "playFabId", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<MinecraftAccountProto_BedrockData>): MinecraftAccountProto_BedrockData {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.mojangJwt = "";
        message.identityJwt = "";
        message.publicKey = "";
        message.privateKey = "";
        message.deviceId = "";
        message.playFabId = "";
        if (value !== undefined)
            reflectionMergePartial<MinecraftAccountProto_BedrockData>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: MinecraftAccountProto_BedrockData): MinecraftAccountProto_BedrockData {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string mojangJwt */ 1:
                    message.mojangJwt = reader.string();
                    break;
                case /* string identityJwt */ 2:
                    message.identityJwt = reader.string();
                    break;
                case /* string publicKey */ 3:
                    message.publicKey = reader.string();
                    break;
                case /* string privateKey */ 4:
                    message.privateKey = reader.string();
                    break;
                case /* string deviceId */ 5:
                    message.deviceId = reader.string();
                    break;
                case /* string playFabId */ 6:
                    message.playFabId = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: MinecraftAccountProto_BedrockData, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string mojangJwt = 1; */
        if (message.mojangJwt !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.mojangJwt);
        /* string identityJwt = 2; */
        if (message.identityJwt !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.identityJwt);
        /* string publicKey = 3; */
        if (message.publicKey !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.publicKey);
        /* string privateKey = 4; */
        if (message.privateKey !== "")
            writer.tag(4, WireType.LengthDelimited).string(message.privateKey);
        /* string deviceId = 5; */
        if (message.deviceId !== "")
            writer.tag(5, WireType.LengthDelimited).string(message.deviceId);
        /* string playFabId = 6; */
        if (message.playFabId !== "")
            writer.tag(6, WireType.LengthDelimited).string(message.playFabId);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message com.soulfiremc.grpc.generated.MinecraftAccountProto.BedrockData
 */
export const MinecraftAccountProto_BedrockData = new MinecraftAccountProto_BedrockData$Type();
