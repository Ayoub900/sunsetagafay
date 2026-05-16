import { redirect } from 'next/navigation'

// Fallback: proxy.ts handles locale detection and redirects at the edge.
// This page is only reached if the proxy misses the root path.
export default function RootPage() {
  redirect('/en')
}
