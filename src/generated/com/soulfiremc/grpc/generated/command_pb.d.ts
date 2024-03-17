import * as jspb from 'google-protobuf'



export class CommandRequest extends jspb.Message {
  getCommand(): string;
  setCommand(value: string): CommandRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CommandRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CommandRequest): CommandRequest.AsObject;
  static serializeBinaryToWriter(message: CommandRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CommandRequest;
  static deserializeBinaryFromReader(message: CommandRequest, reader: jspb.BinaryReader): CommandRequest;
}

export namespace CommandRequest {
  export type AsObject = {
    command: string,
  }
}

export class CommandResponse extends jspb.Message {
  getCode(): number;
  setCode(value: number): CommandResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CommandResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CommandResponse): CommandResponse.AsObject;
  static serializeBinaryToWriter(message: CommandResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CommandResponse;
  static deserializeBinaryFromReader(message: CommandResponse, reader: jspb.BinaryReader): CommandResponse;
}

export namespace CommandResponse {
  export type AsObject = {
    code: number,
  }
}

export class CommandCompletionRequest extends jspb.Message {
  getCommand(): string;
  setCommand(value: string): CommandCompletionRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CommandCompletionRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CommandCompletionRequest): CommandCompletionRequest.AsObject;
  static serializeBinaryToWriter(message: CommandCompletionRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CommandCompletionRequest;
  static deserializeBinaryFromReader(message: CommandCompletionRequest, reader: jspb.BinaryReader): CommandCompletionRequest;
}

export namespace CommandCompletionRequest {
  export type AsObject = {
    command: string,
  }
}

export class CommandHistoryRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CommandHistoryRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CommandHistoryRequest): CommandHistoryRequest.AsObject;
  static serializeBinaryToWriter(message: CommandHistoryRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CommandHistoryRequest;
  static deserializeBinaryFromReader(message: CommandHistoryRequest, reader: jspb.BinaryReader): CommandHistoryRequest;
}

export namespace CommandHistoryRequest {
  export type AsObject = {
  }
}

export class CommandCompletionResponse extends jspb.Message {
  getSuggestionsList(): Array<string>;
  setSuggestionsList(value: Array<string>): CommandCompletionResponse;
  clearSuggestionsList(): CommandCompletionResponse;
  addSuggestions(value: string, index?: number): CommandCompletionResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CommandCompletionResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CommandCompletionResponse): CommandCompletionResponse.AsObject;
  static serializeBinaryToWriter(message: CommandCompletionResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CommandCompletionResponse;
  static deserializeBinaryFromReader(message: CommandCompletionResponse, reader: jspb.BinaryReader): CommandCompletionResponse;
}

export namespace CommandCompletionResponse {
  export type AsObject = {
    suggestionsList: Array<string>,
  }
}

export class CommandHistoryEntry extends jspb.Message {
  getTimestamp(): number;
  setTimestamp(value: number): CommandHistoryEntry;

  getCommand(): string;
  setCommand(value: string): CommandHistoryEntry;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CommandHistoryEntry.AsObject;
  static toObject(includeInstance: boolean, msg: CommandHistoryEntry): CommandHistoryEntry.AsObject;
  static serializeBinaryToWriter(message: CommandHistoryEntry, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CommandHistoryEntry;
  static deserializeBinaryFromReader(message: CommandHistoryEntry, reader: jspb.BinaryReader): CommandHistoryEntry;
}

export namespace CommandHistoryEntry {
  export type AsObject = {
    timestamp: number,
    command: string,
  }
}

export class CommandHistoryResponse extends jspb.Message {
  getEntriesList(): Array<CommandHistoryEntry>;
  setEntriesList(value: Array<CommandHistoryEntry>): CommandHistoryResponse;
  clearEntriesList(): CommandHistoryResponse;
  addEntries(value?: CommandHistoryEntry, index?: number): CommandHistoryEntry;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CommandHistoryResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CommandHistoryResponse): CommandHistoryResponse.AsObject;
  static serializeBinaryToWriter(message: CommandHistoryResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CommandHistoryResponse;
  static deserializeBinaryFromReader(message: CommandHistoryResponse, reader: jspb.BinaryReader): CommandHistoryResponse;
}

export namespace CommandHistoryResponse {
  export type AsObject = {
    entriesList: Array<CommandHistoryEntry.AsObject>,
  }
}

