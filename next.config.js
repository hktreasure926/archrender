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