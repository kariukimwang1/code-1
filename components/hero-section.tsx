import Link from "next/link"
import { Sparkles } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-12 px-4">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground/80">The transparent token economy</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-balance leading-tight">
          Earn <span className="gradient-text">MINER Tokens</span> Through{" "}
          <span className="gradient-text">Legitimate Work</span>
        </h1>

        <p className="text-xl text-foreground/60 max-w-2xl mx-auto text-balance">
          Complete curated tasks, stake tokens, and withdraw fiat directly to PayPal. Built on blockchain with full
          transparency and compliance.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Link href="/signup" className="btn-primary px-8 py-3 text-lg">
            Get Started Free
          </Link>
          <Link href="#how-it-works" className="btn-secondary px-8 py-3 text-lg">
            Learn More
          </Link>
        </div>

        <div className="pt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto text-center text-foreground/60">
          <div>
            <div className="text-3xl font-bold text-primary mb-2">50K+</div>
            <p className="text-sm">Active Users</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent mb-2">$2.5M</div>
            <p className="text-sm">Distributed</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">24/7</div>
            <p className="text-sm">Transparent</p>
          </div>
        </div>
      </div>
    </section>
  )
}
