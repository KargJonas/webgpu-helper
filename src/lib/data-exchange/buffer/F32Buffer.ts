import GPUInterfaceType from "../GPUInterfaceType.ts";

export default class F32Buffer extends GPUInterfaceType {

  constructor(bufferName: string) {
    super(Float32Array, "f32", 4, bufferName);
  }
}
