
@compute @workgroup_size(WORKGROUP_SIZE)
fn main(
  @builtin(global_invocation_id) global_id : vec3u,
  @builtin(local_invocation_id) local_id : vec3u
) {
  output[global_id.x] = f32(a[global_id.x] * b[global_id.x]);
}
