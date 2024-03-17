import * as jspb from 'google-protobuf'



export class ClientDataRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ClientDataRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ClientDataRequest): ClientDataRequest.AsObject;
  static serializeBinaryToWriter(message: ClientDataRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ClientDataRequest;
  static deserializeBinaryFromReader(message: ClientDataRequest, reader: jspb.BinaryReader): ClientDataRequest;
}

export namespace ClientDataRequest {
  export type AsObject = {
  }
}

export class StringSetting extends jspb.Message {
  getDef(): string;
  setDef(value: string): StringSetting;

  getSecret(): boolean;
  setSecret(value: boolean): StringSetting;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StringSetting.AsObject;
  static toObject(includeInstance: boolean, msg: StringSetting): StringSetting.AsObject;
  static serializeBinaryToWriter(message: StringSetting, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StringSetting;
  static deserializeBinaryFromReader(message: StringSetting, reader: jspb.BinaryReader): StringSetting;
}

export namespace StringSetting {
  export type AsObject = {
    def: string,
    secret: boolean,
  }
}

export class IntSetting extends jspb.Message {
  getDef(): number;
  setDef(value: number): IntSetting;

  getMin(): number;
  setMin(value: number): IntSetting;

  getMax(): number;
  setMax(value: number): IntSetting;

  getStep(): number;
  setStep(value: number): IntSetting;

  getFormat(): string;
  setFormat(value: string): IntSetting;
  hasFormat(): boolean;
  clearFormat(): IntSetting;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): IntSetting.AsObject;
  static toObject(includeInstance: boolean, msg: IntSetting): IntSetting.AsObject;
  static serializeBinaryToWriter(message: IntSetting, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): IntSetting;
  static deserializeBinaryFromReader(message: IntSetting, reader: jspb.BinaryReader): IntSetting;
}

export namespace IntSetting {
  export type AsObject = {
    def: number,
    min: number,
    max: number,
    step: number,
    format?: string,
  }

  export enum FormatCase { 
    _FORMAT_NOT_SET = 0,
    FORMAT = 5,
  }
}

export class DoubleSetting extends jspb.Message {
  getDef(): number;
  setDef(value: number): DoubleSetting;

  getMin(): number;
  setMin(value: number): DoubleSetting;

  getMax(): number;
  setMax(value: number): DoubleSetting;

  getStep(): number;
  setStep(value: number): DoubleSetting;

  getFormat(): string;
  setFormat(value: string): DoubleSetting;
  hasFormat(): boolean;
  clearFormat(): DoubleSetting;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DoubleSetting.AsObject;
  static toObject(includeInstance: boolean, msg: DoubleSetting): DoubleSetting.AsObject;
  static serializeBinaryToWriter(message: DoubleSetting, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DoubleSetting;
  static deserializeBinaryFromReader(message: DoubleSetting, reader: jspb.BinaryReader): DoubleSetting;
}

export namespace DoubleSetting {
  export type AsObject = {
    def: number,
    min: number,
    max: number,
    step: number,
    format?: string,
  }

  export enum FormatCase { 
    _FORMAT_NOT_SET = 0,
    FORMAT = 5,
  }
}

export class BoolSetting extends jspb.Message {
  getDef(): boolean;
  setDef(value: boolean): BoolSetting;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BoolSetting.AsObject;
  static toObject(includeInstance: boolean, msg: BoolSetting): BoolSetting.AsObject;
  static serializeBinaryToWriter(message: BoolSetting, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BoolSetting;
  static deserializeBinaryFromReader(message: BoolSetting, reader: jspb.BinaryReader): BoolSetting;
}

export namespace BoolSetting {
  export type AsObject = {
    def: boolean,
  }
}

export class ComboOption extends jspb.Message {
  getId(): string;
  setId(value: string): ComboOption;

  getDisplayname(): string;
  setDisplayname(value: string): ComboOption;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ComboOption.AsObject;
  static toObject(includeInstance: boolean, msg: ComboOption): ComboOption.AsObject;
  static serializeBinaryToWriter(message: ComboOption, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ComboOption;
  static deserializeBinaryFromReader(message: ComboOption, reader: jspb.BinaryReader): ComboOption;
}

export namespace ComboOption {
  export type AsObject = {
    id: string,
    displayname: string,
  }
}

export class ComboSetting extends jspb.Message {
  getOptionsList(): Array<ComboOption>;
  setOptionsList(value: Array<ComboOption>): ComboSetting;
  clearOptionsList(): ComboSetting;
  addOptions(value?: ComboOption, index?: number): ComboOption;

  getDef(): number;
  setDef(value: number): ComboSetting;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ComboSetting.AsObject;
  static toObject(includeInstance: boolean, msg: ComboSetting): ComboSetting.AsObject;
  static serializeBinaryToWriter(message: ComboSetting, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ComboSetting;
  static deserializeBinaryFromReader(message: ComboSetting, reader: jspb.BinaryReader): ComboSetting;
}

export namespace ComboSetting {
  export type AsObject = {
    optionsList: Array<ComboOption.AsObject>,
    def: number,
  }
}

export class ClientPluginSettingType extends jspb.Message {
  getString(): StringSetting | undefined;
  setString(value?: StringSetting): ClientPluginSettingType;
  hasString(): boolean;
  clearString(): ClientPluginSettingType;

  getInt(): IntSetting | undefined;
  setInt(value?: IntSetting): ClientPluginSettingType;
  hasInt(): boolean;
  clearInt(): ClientPluginSettingType;

  getDouble(): DoubleSetting | undefined;
  setDouble(value?: DoubleSetting): ClientPluginSettingType;
  hasDouble(): boolean;
  clearDouble(): ClientPluginSettingType;

  getBool(): BoolSetting | undefined;
  setBool(value?: BoolSetting): ClientPluginSettingType;
  hasBool(): boolean;
  clearBool(): ClientPluginSettingType;

  getCombo(): ComboSetting | undefined;
  setCombo(value?: ComboSetting): ClientPluginSettingType;
  hasCombo(): boolean;
  clearCombo(): ClientPluginSettingType;

  getValueCase(): ClientPluginSettingType.ValueCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ClientPluginSettingType.AsObject;
  static toObject(includeInstance: boolean, msg: ClientPluginSettingType): ClientPluginSettingType.AsObject;
  static serializeBinaryToWriter(message: ClientPluginSettingType, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ClientPluginSettingType;
  static deserializeBinaryFromReader(message: ClientPluginSettingType, reader: jspb.BinaryReader): ClientPluginSettingType;
}

export namespace ClientPluginSettingType {
  export type AsObject = {
    string?: StringSetting.AsObject,
    pb_int?: IntSetting.AsObject,
    pb_double?: DoubleSetting.AsObject,
    bool?: BoolSetting.AsObject,
    combo?: ComboSetting.AsObject,
  }

  export enum ValueCase { 
    VALUE_NOT_SET = 0,
    STRING = 1,
    INT = 2,
    DOUBLE = 3,
    BOOL = 4,
    COMBO = 5,
  }
}

export class ClientPluginSettingEntrySingle extends jspb.Message {
  getKey(): string;
  setKey(value: string): ClientPluginSettingEntrySingle;

  getUiname(): string;
  setUiname(value: string): ClientPluginSettingEntrySingle;

  getCliflagsList(): Array<string>;
  setCliflagsList(value: Array<string>): ClientPluginSettingEntrySingle;
  clearCliflagsList(): ClientPluginSettingEntrySingle;
  addCliflags(value: string, index?: number): ClientPluginSettingEntrySingle;

  getDescription(): string;
  setDescription(value: string): ClientPluginSettingEntrySingle;

  getHint(): string;
  setHint(value: string): ClientPluginSettingEntrySingle;
  hasHint(): boolean;
  clearHint(): ClientPluginSettingEntrySingle;

  getType(): ClientPluginSettingType | undefined;
  setType(value?: ClientPluginSettingType): ClientPluginSettingEntrySingle;
  hasType(): boolean;
  clearType(): ClientPluginSettingEntrySingle;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ClientPluginSettingEntrySingle.AsObject;
  static toObject(includeInstance: boolean, msg: ClientPluginSettingEntrySingle): ClientPluginSettingEntrySingle.AsObject;
  static serializeBinaryToWriter(message: ClientPluginSettingEntrySingle, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ClientPluginSettingEntrySingle;
  static deserializeBinaryFromReader(message: ClientPluginSettingEntrySingle, reader: jspb.BinaryReader): ClientPluginSettingEntrySingle;
}

export namespace ClientPluginSettingEntrySingle {
  export type AsObject = {
    key: string,
    uiname: string,
    cliflagsList: Array<string>,
    description: string,
    hint?: string,
    type?: ClientPluginSettingType.AsObject,
  }

  export enum HintCase { 
    _HINT_NOT_SET = 0,
    HINT = 5,
  }
}

export class ClientPluginSettingEntryMinMaxPairSingle extends jspb.Message {
  getKey(): string;
  setKey(value: string): ClientPluginSettingEntryMinMaxPairSingle;

  getUiname(): string;
  setUiname(value: string): ClientPluginSettingEntryMinMaxPairSingle;

  getCliflagsList(): Array<string>;
  setCliflagsList(value: Array<string>): ClientPluginSettingEntryMinMaxPairSingle;
  clearCliflagsList(): ClientPluginSettingEntryMinMaxPairSingle;
  addCliflags(value: string, index?: number): ClientPluginSettingEntryMinMaxPairSingle;

  getDescription(): string;
  setDescription(value: string): ClientPluginSettingEntryMinMaxPairSingle;

  getHint(): string;
  setHint(value: string): ClientPluginSettingEntryMinMaxPairSingle;
  hasHint(): boolean;
  clearHint(): ClientPluginSettingEntryMinMaxPairSingle;

  getIntsetting(): IntSetting | undefined;
  setIntsetting(value?: IntSetting): ClientPluginSettingEntryMinMaxPairSingle;
  hasIntsetting(): boolean;
  clearIntsetting(): ClientPluginSettingEntryMinMaxPairSingle;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ClientPluginSettingEntryMinMaxPairSingle.AsObject;
  static toObject(includeInstance: boolean, msg: ClientPluginSettingEntryMinMaxPairSingle): ClientPluginSettingEntryMinMaxPairSingle.AsObject;
  static serializeBinaryToWriter(message: ClientPluginSettingEntryMinMaxPairSingle, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ClientPluginSettingEntryMinMaxPairSingle;
  static deserializeBinaryFromReader(message: ClientPluginSettingEntryMinMaxPairSingle, reader: jspb.BinaryReader): ClientPluginSettingEntryMinMaxPairSingle;
}

export namespace ClientPluginSettingEntryMinMaxPairSingle {
  export type AsObject = {
    key: string,
    uiname: string,
    cliflagsList: Array<string>,
    description: string,
    hint?: string,
    intsetting?: IntSetting.AsObject,
  }

  export enum HintCase { 
    _HINT_NOT_SET = 0,
    HINT = 5,
  }
}

export class ClientPluginSettingEntryMinMaxPair extends jspb.Message {
  getMin(): ClientPluginSettingEntryMinMaxPairSingle | undefined;
  setMin(value?: ClientPluginSettingEntryMinMaxPairSingle): ClientPluginSettingEntryMinMaxPair;
  hasMin(): boolean;
  clearMin(): ClientPluginSettingEntryMinMaxPair;

  getMax(): ClientPluginSettingEntryMinMaxPairSingle | undefined;
  setMax(value?: ClientPluginSettingEntryMinMaxPairSingle): ClientPluginSettingEntryMinMaxPair;
  hasMax(): boolean;
  clearMax(): ClientPluginSettingEntryMinMaxPair;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ClientPluginSettingEntryMinMaxPair.AsObject;
  static toObject(includeInstance: boolean, msg: ClientPluginSettingEntryMinMaxPair): ClientPluginSettingEntryMinMaxPair.AsObject;
  static serializeBinaryToWriter(message: ClientPluginSettingEntryMinMaxPair, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ClientPluginSettingEntryMinMaxPair;
  static deserializeBinaryFromReader(message: ClientPluginSettingEntryMinMaxPair, reader: jspb.BinaryReader): ClientPluginSettingEntryMinMaxPair;
}

export namespace ClientPluginSettingEntryMinMaxPair {
  export type AsObject = {
    min?: ClientPluginSettingEntryMinMaxPairSingle.AsObject,
    max?: ClientPluginSettingEntryMinMaxPairSingle.AsObject,
  }
}

export class ClientPluginSettingEntry extends jspb.Message {
  getSingle(): ClientPluginSettingEntrySingle | undefined;
  setSingle(value?: ClientPluginSettingEntrySingle): ClientPluginSettingEntry;
  hasSingle(): boolean;
  clearSingle(): ClientPluginSettingEntry;

  getMinmaxpair(): ClientPluginSettingEntryMinMaxPair | undefined;
  setMinmaxpair(value?: ClientPluginSettingEntryMinMaxPair): ClientPluginSettingEntry;
  hasMinmaxpair(): boolean;
  clearMinmaxpair(): ClientPluginSettingEntry;

  getValueCase(): ClientPluginSettingEntry.ValueCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ClientPluginSettingEntry.AsObject;
  static toObject(includeInstance: boolean, msg: ClientPluginSettingEntry): ClientPluginSettingEntry.AsObject;
  static serializeBinaryToWriter(message: ClientPluginSettingEntry, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ClientPluginSettingEntry;
  static deserializeBinaryFromReader(message: ClientPluginSettingEntry, reader: jspb.BinaryReader): ClientPluginSettingEntry;
}

export namespace ClientPluginSettingEntry {
  export type AsObject = {
    single?: ClientPluginSettingEntrySingle.AsObject,
    minmaxpair?: ClientPluginSettingEntryMinMaxPair.AsObject,
  }

  export enum ValueCase { 
    VALUE_NOT_SET = 0,
    SINGLE = 1,
    MINMAXPAIR = 2,
  }
}

export class ClientPluginSettingsPage extends jspb.Message {
  getHidden(): boolean;
  setHidden(value: boolean): ClientPluginSettingsPage;

  getPagename(): string;
  setPagename(value: string): ClientPluginSettingsPage;

  getNamespace(): string;
  setNamespace(value: string): ClientPluginSettingsPage;

  getEntriesList(): Array<ClientPluginSettingEntry>;
  setEntriesList(value: Array<ClientPluginSettingEntry>): ClientPluginSettingsPage;
  clearEntriesList(): ClientPluginSettingsPage;
  addEntries(value?: ClientPluginSettingEntry, index?: number): ClientPluginSettingEntry;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ClientPluginSettingsPage.AsObject;
  static toObject(includeInstance: boolean, msg: ClientPluginSettingsPage): ClientPluginSettingsPage.AsObject;
  static serializeBinaryToWriter(message: ClientPluginSettingsPage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ClientPluginSettingsPage;
  static deserializeBinaryFromReader(message: ClientPluginSettingsPage, reader: jspb.BinaryReader): ClientPluginSettingsPage;
}

export namespace ClientPluginSettingsPage {
  export type AsObject = {
    hidden: boolean,
    pagename: string,
    namespace: string,
    entriesList: Array<ClientPluginSettingEntry.AsObject>,
  }
}

export class ClientPlugin extends jspb.Message {
  getId(): string;
  setId(value: string): ClientPlugin;

  getVersion(): string;
  setVersion(value: string): ClientPlugin;

  getDescription(): string;
  setDescription(value: string): ClientPlugin;

  getProvider(): string;
  setProvider(value: string): ClientPlugin;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ClientPlugin.AsObject;
  static toObject(includeInstance: boolean, msg: ClientPlugin): ClientPlugin.AsObject;
  static serializeBinaryToWriter(message: ClientPlugin, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ClientPlugin;
  static deserializeBinaryFromReader(message: ClientPlugin, reader: jspb.BinaryReader): ClientPlugin;
}

export namespace ClientPlugin {
  export type AsObject = {
    id: string,
    version: string,
    description: string,
    provider: string,
  }
}

export class UIClientDataResponse extends jspb.Message {
  getUsername(): string;
  setUsername(value: string): UIClientDataResponse;

  getPluginsList(): Array<ClientPlugin>;
  setPluginsList(value: Array<ClientPlugin>): UIClientDataResponse;
  clearPluginsList(): UIClientDataResponse;
  addPlugins(value?: ClientPlugin, index?: number): ClientPlugin;

  getPluginsettingsList(): Array<ClientPluginSettingsPage>;
  setPluginsettingsList(value: Array<ClientPluginSettingsPage>): UIClientDataResponse;
  clearPluginsettingsList(): UIClientDataResponse;
  addPluginsettings(value?: ClientPluginSettingsPage, index?: number): ClientPluginSettingsPage;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UIClientDataResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UIClientDataResponse): UIClientDataResponse.AsObject;
  static serializeBinaryToWriter(message: UIClientDataResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UIClientDataResponse;
  static deserializeBinaryFromReader(message: UIClientDataResponse, reader: jspb.BinaryReader): UIClientDataResponse;
}

export namespace UIClientDataResponse {
  export type AsObject = {
    username: string,
    pluginsList: Array<ClientPlugin.AsObject>,
    pluginsettingsList: Array<ClientPluginSettingsPage.AsObject>,
  }
}

