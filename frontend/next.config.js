/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    // TODO: Replace '**' with actual backend hostname when deploying to production
    // e.g., { protocol: 'https', hostname: 'your-backend.railway.app' }
    domains: ['images.unsplash.com', 'localhost', '127.0.0.1'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
};

module.exports = nextConfig;
