/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  transpilePackages: ['@lab/types'],
  output: 'standalone',
}

export default nextConfig
