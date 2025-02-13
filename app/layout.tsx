// Import modules
import { type Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from "@/app/provider"
import "@/app/globals.css"

// Font
const inter = Inter({ subsets: ["latin"] })

// Metadata
export const metadata: Metadata = {
	title: "Documentation",
	description: "Documentation search with AI assistance",
}

// RootLayout
export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning={true}>
			<body className={inter.className}>
				<Providers
					attribute="class"
					defaultTheme="dark"
					enableSystem={true}
					disableTransitionOnChange={true}
				>
					{children}
				</Providers>
			</body>
		</html>
	)
}
