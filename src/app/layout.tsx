import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Railwy — Build Dashboard',
  description: 'Real-time monitoring for autonomous AI code generation projects',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
