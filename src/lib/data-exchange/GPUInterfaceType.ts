
// TODO
type JsArrayConstructorType = Float32ArrayConstructor | Int32ArrayConstructor;

export default class GPUInterfaceType {
  private readonly jsConstructor: JsArrayConstructorType;
  private readonly WGSLType: string;
  private readonly bufferName: string;
  private bindingIndex: number | undefined;
  private readonly bufferItemSize: number;
  private readonly groupIndex: number;

  constructor(
    jsConstructor: JsArrayConstructorType,
    WGSLType: string,
    bufferItemSizeBytes: number,
    bufferName: string,
    groupIndex: number = 0
  ) {
    this.jsConstructor = jsConstructor;
    this.WGSLType = WGSLType;
    this.bufferItemSize = bufferItemSizeBytes;
    this.bufferName = bufferName;
    this.groupIndex = groupIndex;
  }

  /**
   * Generates the string that will be injected into the WGSL shader code.
   */
  public getWGSLInjectionString() {

    return (
      `@group(${this.groupIndex}) @binding(${this.bindingIndex}) ` +
      `var<storage, read_write> ${this.bufferName}: array<${this.WGSLType}>;\n`
    );
  }

  public setBindingIndex(bindingIndex: number) {
    this.bindingIndex = bindingIndex;
  }

  public getJsConstructor(): JsArrayConstructorType {
    return this.jsConstructor;
  }

  public getBufferItemSize(): number {
    return this.bufferItemSize;
  }
}