/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep rocketride + its WebSocket deps as runtime CommonJS requires
    // instead of bundling them through Webpack. Without this, Next's
    // bundler breaks the native `bufferutil` binding for `ws`, causing
    // "bufferUtil.mask is not a function" mid-call.
    serverComponentsExternalPackages: ['rocketride', 'ws', 'bufferutil', 'utf-8-validate'],
  },
}
module.exports = nextConfig
