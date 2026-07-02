/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignore ESLint errors during builds so that unused imports/variables
    // in prototype portals do not block compilation.
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/dhic',
        destination: '/dhic/app',
      },
      {
        // Rewrite sub-routes like /dhic/alerts -> /dhic/app/alerts,
        // excluding paths that already start with /dhic/app
        source: '/dhic/:path((?!app/|app$).*)',
        destination: '/dhic/app/:path*',
      },
    ];
  },
};

export default nextConfig;
