import GPUController from "./lib/GPUController.ts";
import F32Buffer from "./lib/data-exchange/buffer/F32Buffer.ts";
import shader from "./shaders/fiction.wgsl?raw";

const gpuController = new GPUController();

async function main() {
  await gpuController.init();

  const gpuFunction = gpuController.createFunction(
    shader,
    new F32Buffer("output"), 8,
    new F32Buffer("input")
  );

  console.time();
  const result = await gpuFunction([0, 1, 2, 3, 4, 5, 6, 7]);
  console.timeEnd();

  console.log(result);
}

main();
