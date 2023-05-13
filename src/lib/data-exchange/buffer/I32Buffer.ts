import GPUInterfaceType from "../GPUInterfaceType.ts";

export default class I32Buffer extends GPUInterfaceType {

  constructor(bufferName: string) {
    super(Int32Array, "i32", 4, bufferName);
  }
}
