/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.tradingview.com',
      },
    ],
  },
  experimental: {
    // reactCompiler: true,
  },
};

module.exports = nextConfig;
