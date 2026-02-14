import { VT323 } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

const vt323 = VT323({
    weight: '400',
    subsets: ['latin'],
    variable: '--font-vt323'
})

export const metadata: Metadata = {
    title: 'AI Roast Show',
    description: 'Human Intuition vs. AI Utility - The Ultimate Debate',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={cn(vt323.variable, vt323.className, "bg-black text-neon-green min-h-screen font-mono selection:bg-neon-green selection:text-black overflow-x-hidden crt")}>
                {children}
            </body>
        </html>
    )
}
