import { CheckCircle2, Wallet, TrendingUp } from "lucide-react"

const steps = [
  {
    icon: CheckCircle2,
    title: "Complete Tasks",
    description: "Choose from curated tasks and complete them to earn MINER tokens instantly",
  },
  {
    icon: Wallet,
    title: "Stake & Earn",
    description: "Stake your tokens for up to 25% APY and unlock premium rewards",
  },
  {
    icon: TrendingUp,
    title: "Withdraw to Fiat",
    description: "Convert to stablecoin and withdraw directly to your PayPal account",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4 bg-card/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-foreground/60">Three simple steps to start earning</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div key={idx} className="relative">
                <div className="bg-background border border-border rounded-lg p-8 card-hover">
                  <div className="mb-6">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-foreground/60">{step.description}</p>
                </div>
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary to-transparent"></div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
