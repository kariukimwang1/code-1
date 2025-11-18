import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-accent/10">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Start Earning?</h2>
        <p className="text-lg text-foreground/60 mb-8">
          Join thousands of users earning passive income through legitimate tasks and staking. No credit card required.
        </p>
        <Link href="/signup" className="btn-primary px-8 py-4 text-lg">
          Sign Up Now
        </Link>
      </div>
    </section>
  )
}
