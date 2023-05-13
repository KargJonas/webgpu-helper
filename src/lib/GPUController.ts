import {GPUFunction} from "./types.ts";
import GPUInterfaceType from "./data-exchange/GPUInterfaceType.ts";

const WORKGROUP_SIZE = 64;

export default class GPUController {

  // TODO
  // @ts-ignore
  private device: GPUDevice;
  private ready = false;

  public async init() {

    // Check if WebGPU is supported
    if (!navigator.gpu) {
      throw Error('WebGPU not supported.');
    }

    // Request and create GPU adapter
    const adapter = await navigator.gpu.requestAdapter();

    // Check if adapter was successfully created
    if (!adapter) {
      throw Error('Couldn\'t request WebGPU adapter.');
    }

    this.device = await adapter.requestDevice();
    this.ready = true;
  }

  // TODO: There should be a version of this method, where the user
  //  can specify the size of the buffers, such that the buffer creation
  //  does not have to occur every time the function is called
  // public createFunction<T extends GPUInterfaceType>(
  //   shader: string,
  //   outputBuffer: BufferConstructor<T>,
  //   outputBufferSize: number,
  //   ...buffers: BufferConstructor<T>[]
  // ): GPUFunction {

  public createFunction(
    shader: string,
    outputBuffer: GPUInterfaceType,
    outputBufferSize: number,
    ...buffers: GPUInterfaceType[]
  ): GPUFunction {

    if (!this.ready) throw new Error("No GPU device.");

    buffers.push(outputBuffer);
    
    const outputBufferSizeBytes = outputBufferSize * outputBuffer.getBufferItemSize();

    const stagingBuffer = this.device.createBuffer({
      size: outputBufferSizeBytes,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
    });

    return async (...inputs: any[]) => {
      let deviceOutputBuffer: GPUBuffer;
      const bindGroupLayoutEntries: GPUBindGroupLayoutEntry[] = [];
      const bindGroupEntries: GPUBindGroupEntry[] = [];
      const shaderPrefixes: string[] = [];

      buffers.forEach((buffer: GPUInterfaceType, index: number) => {
        const isOutputBuffer = index == buffers.length - 1;

        buffer.setBindingIndex(index);
        shaderPrefixes.push(buffer.getWGSLInjectionString());

        const bufferSize = isOutputBuffer ? outputBufferSize : inputs[index].length;

        const deviceBuffer: GPUBuffer = this.device.createBuffer({
          size: bufferSize * buffer.getBufferItemSize(),
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
        });

        bindGroupLayoutEntries.push({
          binding: index,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }
        });

        bindGroupEntries.push({
          binding: index,
          resource: { buffer: deviceBuffer }
        });

        // Output buffer is always last element in buffers list.
        // No need to add data into the output buffer
        if (isOutputBuffer) {
          deviceOutputBuffer = deviceBuffer;
          return;
        }

        const ArrayConstructor = buffer.getJsConstructor();
        this.device.queue.writeBuffer(
          deviceBuffer, 0, new ArrayConstructor(inputs[index]));

      });

      const bindGroupLayout =
        this.device.createBindGroupLayout({
          entries: bindGroupLayoutEntries
        });

      const bindGroup = this.device.createBindGroup({
        layout: bindGroupLayout,
        entries: bindGroupEntries
      });

      const modifiedShader = `${shaderPrefixes.join('\n')}${shader.replace("WORKGROUP_SIZE", WORKGROUP_SIZE.toString())}`;

      const shaderModule = this.device.createShaderModule({
        code: modifiedShader
      });

      const computePipeline = this.device.createComputePipeline({
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [bindGroupLayout]
        }),
        compute: {
          module: shaderModule,
          entryPoint: 'main'
        }
      });

      // 5: Create GPUCommandEncoder to issue commands to the GPU
      const commandEncoder = this.device.createCommandEncoder();

      // 6: Initiate render pass
      const passEncoder = commandEncoder.beginComputePass();

      // 7: Issue commands
      passEncoder.setPipeline(computePipeline);
      passEncoder.setBindGroup(0, bindGroup);
      passEncoder.dispatchWorkgroups(Math.ceil((outputBufferSizeBytes) / 64));

      // End the render pass
      passEncoder.end();

      // Copy output buffer to staging buffer
      commandEncoder.copyBufferToBuffer(
        // TODO
        // @ts-ignore
        deviceOutputBuffer,
        0, // Source offset
        stagingBuffer,
        0, // Destination offset
        outputBufferSizeBytes
      );

      // 8: End frame by passing array of command buffers
      // to command queue for execution
      this.device.queue.submit([commandEncoder.finish()]);

      // map staging buffer to read results back to JS
      await stagingBuffer.mapAsync(
        GPUMapMode.READ,
        0, // Offset
        outputBufferSizeBytes // Length
      );

      const copyArrayBuffer = stagingBuffer.getMappedRange(0, outputBufferSizeBytes);
      const data = copyArrayBuffer.slice(0);

      stagingBuffer.unmap();

      const OutputBufferConstructor = outputBuffer.getJsConstructor();

      return new OutputBufferConstructor(data);
    };
  }
}