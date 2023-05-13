
// TODO
export type JsBuffer = Float32Array | Int32Array;
export type GPUFunction = (...inputs: any[]) => Promise<JsBuffer>;
