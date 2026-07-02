// CSS Module declarations
declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

// Image declarations for Leaflet assets
declare module "leaflet/dist/images/marker-icon-2x.png" {
  const src: string;
  export default src;
}

declare module "leaflet/dist/images/marker-icon.png" {
  const src: string;
  export default src;
}

declare module "leaflet/dist/images/marker-shadow.png" {
  const src: string;
  export default src;
}

// next-env.d.ts compatibility
/// <reference types="next" />
/// <reference types="next/image-types/global" />
