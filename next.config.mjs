/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  // ESLint configuration for development
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  // Image optimization
  images: {
    unoptimized: true,
    domains: [
      'localhost',
      '127.0.0.1',
      'vercel.app',
      'githubusercontent.com',
      'cloudinary.com',
      'aws.amazon.com',
    ],
  },
  // Development optimization
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Redirects and rewrites
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/overview',
        permanent: false,
      },
    ];
  },
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  // Development server configuration
  experimental: {
    serverComponentsExternalPackages: ['pg'],
  },
}

export default nextConfig
