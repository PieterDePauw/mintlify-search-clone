// Import modules
import { DocumentationSearch } from "@/components/doc-search"
import { ModeToggle } from "@/components/mode-toggle"

// HomePage
export default function HomePage() {
	return (
		<main className="min-h-screen bg-zinc-50 p-4 transition-colors dark:bg-zinc-950">
			<nav className="mx-auto flex max-w-7xl items-center justify-between">
				<DocumentationSearch />
				<ModeToggle />
			</nav>
		</main>
	)
}
