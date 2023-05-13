import GPUController from "./lib/GPUController.ts";
import F32Buffer from "./lib/data-exchange/buffer/F32Buffer.ts";

const gpuController = new GPUController();

const shader = `
  @compute @workgroup_size(WORKGROUP_SIZE)
  fn main(
    @builtin(global_invocation_id) global_id : vec3u,
    @builtin(local_invocation_id) local_id : vec3u
  ) {
    output[global_id.x] = f32(input[global_id.x]);
  }
`;

async function main() {
  await gpuController.init();

  const gpuFunction = gpuController.createFunction(
    shader,
    new F32Buffer("output"), 8,
    new F32Buffer("input")
  );

  const result = await gpuFunction(
    new Float32Array([0, 1, 2, 3, 4, 5, 6, 7]));

  console.log(result)
}

main();
