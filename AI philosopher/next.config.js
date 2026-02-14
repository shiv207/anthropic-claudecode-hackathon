/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Let app/api route handlers live under app/ in this setup
  experimental: {
    serverActions: true,
  },
}
module.exports = nextConfig;
