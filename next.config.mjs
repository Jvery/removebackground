/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for fully client-side deployment (Azure Static Web Apps)
  output: 'export',

  // Required for @xenova/transformers WASM files
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'sharp$': false,
      'onnxruntime-node$': false,
    }
    return config
  },

  // Note: COEP/COOP headers required for SharedArrayBuffer/WASM/WebGPU are set
  // in nginx.conf.template (served via the Docker/nginx container)
}

export default nextConfig
