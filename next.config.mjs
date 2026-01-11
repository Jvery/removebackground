/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for fully client-side deployment
  // output: 'export', // Uncomment for static hosting (GitHub Pages, etc.)
  
  // Required for @xenova/transformers WASM files
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'sharp$': false,
      'onnxruntime-node$': false,
    }
    return config
  },

  // Headers for SharedArrayBuffer (required for some WASM optimizations)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
