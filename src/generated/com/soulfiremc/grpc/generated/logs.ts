// @generated by protobuf-ts 2.9.4
// @generated from protobuf file "com/soulfiremc/grpc/generated/logs.proto" (package "com.soulfiremc.grpc.generated", syntax proto3)
// tslint:disable
import { ServiceType } from "@protobuf-ts/runtime-rpc";
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
 * @generated from protobuf message com.soulfiremc.grpc.generated.LogRequest
 */
export interface LogRequest {
    /**
     * @generated from protobuf field: uint32 previous = 1;
     */
    previous: number;
}
/**
 * @generated from protobuf message com.soulfiremc.grpc.generated.LogResponse
 */
export interface LogResponse {
    /**
     * @generated from protobuf field: string message = 1;
     */
    message: string;
}
// @generated message type with reflection information, may provide speed optimized methods
class LogRequest$Type extends MessageType<LogRequest> {
    constructor() {
        super("com.soulfiremc.grpc.generated.LogRequest", [
            { no: 1, name: "previous", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value?: PartialMessage<LogRequest>): LogRequest {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.previous = 0;
        if (value !== undefined)
            reflectionMergePartial<LogRequest>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: LogRequest): LogRequest {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* uint32 previous */ 1:
                    message.previous = reader.uint32();
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
    internalBinaryWrite(message: LogRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* uint32 previous = 1; */
        if (message.previous !== 0)
            writer.tag(1, WireType.Varint).uint32(message.previous);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message com.soulfiremc.grpc.generated.LogRequest
 */
export const LogRequest = new LogRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class LogResponse$Type extends MessageType<LogResponse> {
    constructor() {
        super("com.soulfiremc.grpc.generated.LogResponse", [
            { no: 1, name: "message", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<LogResponse>): LogResponse {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.message = "";
        if (value !== undefined)
            reflectionMergePartial<LogResponse>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: LogResponse): LogResponse {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string message */ 1:
                    message.message = reader.string();
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
    internalBinaryWrite(message: LogResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string message = 1; */
        if (message.message !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.message);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message com.soulfiremc.grpc.generated.LogResponse
 */
export const LogResponse = new LogResponse$Type();
/**
 * @generated ServiceType for protobuf service com.soulfiremc.grpc.generated.LogsService
 */
export const LogsService = new ServiceType("com.soulfiremc.grpc.generated.LogsService", [
    { name: "subscribe", serverStreaming: true, options: {}, I: LogRequest, O: LogResponse }
]);
