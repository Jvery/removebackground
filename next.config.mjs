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

  // Note: Headers are configured in staticwebapp.config.json for Azure Static Web Apps
  // (COEP/COOP headers required for SharedArrayBuffer/WASM optimizations)
}

export default nextConfig
