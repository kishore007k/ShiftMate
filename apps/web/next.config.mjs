/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@shiftmate/types'],
  async rewrites() {
    // Proxy /api/* to the backend so the browser only ever talks to this origin —
    // otherwise the session cookie is cross-site and Safari/iOS silently drops it.
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
    return [{ source: '/api/:path*', destination: `${apiBase}/api/:path*` }];
  },
};

export default nextConfig;
