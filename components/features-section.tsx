import { Shield, Zap, Users, BarChart3, Lock, Smartphone } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Fully Compliant",
    description: "KYC verified, AML checked, transparent token distribution",
  },
  {
    icon: Zap,
    title: "Instant Rewards",
    description: "Earn tokens immediately after completing verified tasks",
  },
  {
    icon: Users,
    title: "Referral Bonuses",
    description: "Earn multi-tier commissions from your referral network",
  },
  {
    icon: BarChart3,
    title: "Real Analytics",
    description: "Track earnings, leaderboards, and performance metrics",
  },
  {
    icon: Lock,
    title: "Secure Staking",
    description: "Lock your tokens and earn competitive APY returns",
  },
  {
    icon: Smartphone,
    title: "Mobile Ready",
    description: "Full PWA support for on-the-go earning and management",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
          <p className="text-lg text-foreground/60">Everything you need to earn and grow</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div key={idx} className="bg-card border border-border rounded-lg p-6 card-hover">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-foreground/60 text-sm">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
