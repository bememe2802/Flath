import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/identity/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_ENDPOINT}/identity/:path*`,
      },
      {
        source: '/profile/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_ENDPOINT}/profile/:path*`,
      },
      {
        source: '/post/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_ENDPOINT}/post/:path*`,
      },
      {
        source: '/notification/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_ENDPOINT}/notification/:path*`,
      },
      {
        source: '/file/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_ENDPOINT}/file/:path*`,
      },
      {
        source: '/chat/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_ENDPOINT}/chat/:path*`,
      },
      {
        source: '/study/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_ENDPOINT}/study/:path*`,
      },
      {
        source: '/newsfeed/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_ENDPOINT}/newsfeed/:path*`,
      },
    ];
  },
};

export default nextConfig;
