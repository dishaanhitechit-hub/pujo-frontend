import type { NextConfig } from "next";
//remove letter
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://132.154.156.82:5999'

// Parse the API base URL to extract hostname/port for next/image remotePatterns.
// Falls back to defaults if the URL is malformed.
let apiHostname = '132.154.156.82'
let apiPort = '5999'
let apiProtocol: 'http' | 'https' = 'http'
try {
  const parsed = new URL(API_BASE)
  apiHostname = parsed.hostname
  apiPort     = parsed.port
  apiProtocol = parsed.protocol.replace(':', '') as 'http' | 'https'
} catch {}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: apiProtocol,
        hostname: apiHostname,
        port:     apiPort,
        pathname: '/media/**',
      },
    ],
  },
}

export default nextConfig
