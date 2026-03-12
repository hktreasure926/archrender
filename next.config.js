/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['firebase', '@firebase/auth', '@firebase/app'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
    serverComponentsExternalPackages: ['undici']
  },
  images: {
    domains: ['localhost', 'n8n.studionomad.cloud'],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/phase1',
        permanent: false,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_N8N_WEBHOOK_URL: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n.studionomad.cloud/webhook/render',
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        undici: false,
      };
      config.resolve.fallback = {
        ...config.resolve.fallback,
        undici: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig