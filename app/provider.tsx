"use client"

// Import modules
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

// Export the Providers component
export function Providers({ children, ...props }: ThemeProviderProps) {
	return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
