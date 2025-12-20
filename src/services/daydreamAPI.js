import axios from "axios";

const API_BASE_URL = "https://api.daydream.live/v1";
const API_KEY = import.meta.env.VITE_DAYDREAM_API_KEY;

if (!API_KEY) {
  console.error("VITE_DAYDREAM_API_KEY not found in environment variables");
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
});

/**
 * Create a new Daydream stream
 * @param {Object} params - Stream parameters (prompt, delta, num_inference_steps, etc)
 * @returns {Promise<Object>} Stream data including whip_url and output_stream_url
 */
export async function createStream(params = {}) {
  const numSteps = params.num_inference_steps || 50;

  const config = {
    pipeline: "streamdiffusion",
    params: {
      model_id: "stabilityai/sdxl-turbo",
      prompt:
        params.prompt ||
        "fantasy game world, vibrant colors, dreamlike atmosphere, magical lighting, detailed environment",
      negative_prompt:
        params.negative_prompt ||
        "blurry, low quality, distorted, flat, 2d, ugly",
      width: 1024,
      height: 576,
      num_inference_steps: numSteps,
      t_index_list: [Math.floor(numSteps * 0.22)],
      guidance_scale:
        params.guidance_scale !== undefined ? params.guidance_scale : 1,
      delta: params.delta !== undefined ? params.delta : 0.7,
      seed: params.seed || 42,
      use_safety_checker: true,
      do_add_noise: true,
      use_lcm_lora: true,
      use_denoising_batch: true,
      normalize_prompt_weights: true,
      normalize_seed_weights: true,
      seed_interpolation_method: "linear",
      prompt_interpolation_method: "slerp",
      enable_similar_image_filter: false,
      similar_image_filter_threshold: 0.98,
      similar_image_filter_max_skip_frame: 10,

      acceleration: "tensorrt",
    },
    name: params.name || "Game Stream - " + new Date().toISOString(),
  };

  const response = await apiClient.post("/streams", config);
  return response.data;
}

/**
 * Update stream parameters dynamically
 * @param {string} streamId - Stream ID
 * @param {Object} params - Parameters to update (prompt, delta, num_inference_steps, etc)
 * @returns {Promise<Object>} Updated stream data
 */
export async function updateStream(streamId, params) {
  const numSteps = params.num_inference_steps || 50;

  const payload = {
    pipeline: "streamdiffusion",
    params: {
      prompt: params.prompt,
      negative_prompt: params.negative_prompt,
      delta: params.delta,
      num_inference_steps: numSteps,
      t_index_list: [Math.floor(numSteps * 0.22)],
      guidance_scale: params.guidance_scale,
      seed: params.seed,
    },
  };

  const response = await apiClient.patch(`/streams/${streamId}`, payload);
  return response.data;
}

/**
 * Get stream status
 * @param {string} streamId - Stream ID
 * @returns {Promise<Object>} Stream status
 */
export async function getStreamStatus(streamId) {
  const response = await apiClient.get(`/streams/${streamId}/status`);
  return response.data;
}

/**
 * Delete a stream
 * @param {string} streamId - Stream ID
 * @returns {Promise<void>}
 */
export async function deleteStream(streamId) {
  await apiClient.delete(`/streams/${streamId}`);
}
