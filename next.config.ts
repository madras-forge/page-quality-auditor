import type { NextConfig } from 'next';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
if (basePath && !/^\/[a-zA-Z0-9._-]+$/.test(basePath))
  throw new Error('Use an empty base path or one repository-name segment.');
const config: NextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  poweredByHeader: false,
};
export default config;
