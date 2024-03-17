import * as jspb from 'google-protobuf'



export class ViewerListRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ViewerListRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ViewerListRequest): ViewerListRequest.AsObject;
  static serializeBinaryToWriter(message: ViewerListRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ViewerListRequest;
  static deserializeBinaryFromReader(message: ViewerListRequest, reader: jspb.BinaryReader): ViewerListRequest;
}

export namespace ViewerListRequest {
  export type AsObject = {
  }
}

export class ViewerListResponse extends jspb.Message {
  getViewersList(): Array<string>;
  setViewersList(value: Array<string>): ViewerListResponse;
  clearViewersList(): ViewerListResponse;
  addViewers(value: string, index?: number): ViewerListResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ViewerListResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ViewerListResponse): ViewerListResponse.AsObject;
  static serializeBinaryToWriter(message: ViewerListResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ViewerListResponse;
  static deserializeBinaryFromReader(message: ViewerListResponse, reader: jspb.BinaryReader): ViewerListResponse;
}

export namespace ViewerListResponse {
  export type AsObject = {
    viewersList: Array<string>,
  }
}

export class ViewerDataRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ViewerDataRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ViewerDataRequest): ViewerDataRequest.AsObject;
  static serializeBinaryToWriter(message: ViewerDataRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ViewerDataRequest;
  static deserializeBinaryFromReader(message: ViewerDataRequest, reader: jspb.BinaryReader): ViewerDataRequest;
}

export namespace ViewerDataRequest {
  export type AsObject = {
  }
}

export class ViewerDataResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ViewerDataResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ViewerDataResponse): ViewerDataResponse.AsObject;
  static serializeBinaryToWriter(message: ViewerDataResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ViewerDataResponse;
  static deserializeBinaryFromReader(message: ViewerDataResponse, reader: jspb.BinaryReader): ViewerDataResponse;
}

export namespace ViewerDataResponse {
  export type AsObject = {
  }
}

