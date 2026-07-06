/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignore ESLint errors during builds so that unused imports/variables
    // in prototype portals do not block compilation.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
