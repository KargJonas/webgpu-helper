import GPUController from "./lib/GPUController.ts";
import F32Buffer from "./lib/data-exchange/buffer/F32Buffer.ts";
import shader from "./shaders/matmul.wgsl?raw";

const gpuController = new GPUController();

async function main() {
  await gpuController.init();

  const gpuFunction = gpuController.createFunction(
    shader,
    new F32Buffer("output"), 8,
    new F32Buffer("a"),
    new F32Buffer("b")
  );

  const mat1 = [];
  const mat2 = [];

  const x = 10000000;

  for (let i = 0; i < x; i++) {
    mat1[i] = Math.random() * 100;
    mat2[i] = Math.random() * 100;
  }

  console.time();
  const result = await gpuFunction(mat1, mat2);
  console.timeEnd();

  console.time();
  const res = [];
  for (let i = 0; i < x; i++) {
    res[i] = mat1[i] * mat2[i];
  }
  console.timeEnd();

  console.log(result);
}

main();

