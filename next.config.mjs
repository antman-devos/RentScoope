/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Never let a broken build slip through silently.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
