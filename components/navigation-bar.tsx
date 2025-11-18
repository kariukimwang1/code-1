"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X, Zap } from "lucide-react"

export function NavigationBar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-black" />
          </div>
          MINER
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#how-it-works" className="hover:text-primary transition-colors">
            How It Works
          </Link>
          <Link href="/login" className="hover:text-primary transition-colors">
            Login
          </Link>
          <Link href="/signup" className="btn-primary px-6 py-2">
            Sign Up
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card p-4 space-y-4">
          <Link href="#how-it-works" className="block hover:text-primary">
            How It Works
          </Link>
          <Link href="/login" className="block hover:text-primary">
            Login
          </Link>
          <Link href="/signup" className="btn-primary w-full text-center py-2">
            Sign Up
          </Link>
        </div>
      )}
    </nav>
  )
}
