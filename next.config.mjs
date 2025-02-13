/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		// ignoreDuringBuilds: true,
	},
	typescript: {
		// ignoreBuildErrors: true,
	},
	images: {
		// unoptimized: true,
	},
	experimental: {
		// webpackBuildWorker: true,
		// parallelServerBuildTraces: true,
		// parallelServerCompiles: true,
	},
}

// Export the Next.js configuration object as default
export default nextConfig
