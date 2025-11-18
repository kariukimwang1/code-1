"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Search, HelpCircle, ChevronDown, ChevronRight, MessageCircle, Mail, ExternalLink, TrendingUp, Award, Shield, DollarSign, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface FAQCategory {
  id: string
  name: string
  icon: React.ElementType
  description: string
  color: string
}

interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
  tags: string[]
  helpful: number
  lastUpdated: string
}

const categories: FAQCategory[] = [
  {
    id: "getting-started",
    name: "Getting Started",
    icon: Users,
    description: "Account setup and basic platform navigation",
    color: "text-blue-500"
  },
  {
    id: "mining",
    name: "Mining",
    icon: Zap,
    description: "Mining operations, rewards, and optimization",
    color: "text-yellow-500"
  },
  {
    id: "staking",
    name: "Staking",
    icon: TrendingUp,
    description: "Token staking, rewards, and lock periods",
    color: "text-green-500"
  },
  {
    id: "payments",
    name: "Payments & Withdrawals",
    icon: DollarSign,
    description: "Payment methods, withdrawals, and fees",
    color: "text-purple-500"
  },
  {
    id: "security",
    name: "Security",
    icon: Shield,
    description: "Account security, 2FA, and protection",
    color: "text-red-500"
  },
  {
    id: "rewards",
    name: "Rewards & Referrals",
    icon: Award,
    description: "Bonus programs, referrals, and achievements",
    color: "text-indigo-500"
  }
]

const faqs: FAQItem[] = [
  {
    id: "1",
    category: "getting-started",
    question: "How do I create an account on MINER?",
    answer: "Creating an account is simple and takes just a few minutes:\n\n1. Click the 'Sign Up' button on our homepage\n2. Enter your email address and create a strong password\n3. Check your email for a verification link\n4. Click the verification link to activate your account\n5. Complete your profile setup and you're ready to start mining!\n\nYou'll automatically start at KYC Level 0 with basic features enabled.",
    tags: ["account", "signup", "beginner"],
    helpful: 89,
    lastUpdated: "2024-11-15"
  },
  {
    id: "2",
    category: "getting-started",
    question: "What is MINER token and how does it work?",
    answer: "MINER is our native utility token that powers the entire ecosystem:\n\n**Key Features:**\n- Fixed supply of 1 billion tokens\n- Earned through mining, staking, and referrals\n- Can be staked for passive income up to 25% APY\n- Tradeable on major cryptocurrency exchanges\n- Used for platform governance and premium features\n\n**Token Distribution:**\n- 40% Community mining rewards\n- 20% Staking rewards pool\n- 20% Team and development\n- 15% Treasury and ecosystem\n- 5% Marketing and partnerships",
    tags: ["token", "cryptocurrency", "blockchain"],
    helpful: 76,
    lastUpdated: "2024-11-14"
  },
  {
    id: "3",
    category: "mining",
    question: "How do I start mining MINER tokens?",
    answer: "Getting started with mining is easy:\n\n**Step 1: System Setup**\n- Ensure you have a stable internet connection\n- Use a modern computer or mobile device\n- Minimum 4GB RAM recommended\n\n**Step 2: Start Mining**\n1. Navigate to the Mining page\n2. Choose from available tasks based on your device capabilities\n3. Click 'Start Mining' to begin\n4. Monitor your progress in real-time\n5. Earn tokens based on task completion and contribution\n\n**Tips for Success:**\n- Start with easier tasks to build your mining level\n- Maintain consistent daily mining for streak bonuses\n- Join our community for mining strategies and tips\n- Upgrade your hardware for better performance and rewards",
    tags: ["mining", "earn", "tasks"],
    helpful: 103,
    lastUpdated: "2024-11-16"
  },
  {
    id: "4",
    category: "mining",
    question: "What are the mining levels and how do they affect earnings?",
    answer: "Mining levels reward consistent and skilled miners:\n\n**Level System:**\n- **Level 1-5:** Basic miners, standard rewards\n- **Level 6-10:** Intermediate miners, 10% bonus rewards\n- **Level 11-15:** Advanced miners, 20% bonus rewards\n- **Level 16-20:** Expert miners, 30% bonus rewards\n- **Level 21+:** Master miners, 40% bonus rewards + exclusive tasks\n\n**How to Level Up:**\n- Complete mining tasks (XP earned per task)\n- Maintain daily mining streaks\n- Achieve high task completion rates\n- Participate in special mining events\n\n**Benefits of Higher Levels:**\n- Increased reward multipliers\n- Access to exclusive high-value tasks\n- Priority support\n- Better referral rates",
    tags: ["levels", "rewards", "progression"],
    helpful: 67,
    lastUpdated: "2024-11-13"
  },
  {
    id: "5",
    category: "staking",
    question: "How does staking work and what are the returns?",
    answer: "Staking allows you to earn passive income by locking your MINER tokens:\n\n**Staking Options:**\n- **Flexible Staking:** 5% APY, withdraw anytime\n- **30-Day Lock:** 15% APY\n- **60-Day Lock:** 20% APY\n- **90-Day Lock:** 25% APY (highest rate)\n\n**How to Stake:**\n1. Go to the Staking page\n2. Choose your preferred lock period\n3. Enter the amount of MINER tokens to stake\n4. Confirm and wait for the transaction to complete\n5. Earn daily rewards automatically\n\n**Key Benefits:**\n- Compounding rewards\n- Flexible lock periods to suit your needs\n- No minimum stake amount\n- Rewards paid daily in MINER tokens\n- Can unstake anytime from flexible positions",
    tags: ["staking", "rewards", "apy"],
    helpful: 92,
    lastUpdated: "2024-11-15"
  },
  {
    id: "6",
    category: "staking",
    question: "Can I lose money staking? What are the risks?",
    answer: "While staking is generally safe, there are some risks to consider:\n\n**Potential Risks:**\n- **Token Price Volatility:** The value of MINER tokens can fluctuate\n- **Early Unstaking Penalties:** 10% penalty on earned rewards for fixed terms\n- **Smart Contract Risk:** Minimal, but inherent in any DeFi protocol\n\n**Safety Measures:**\n- Smart contracts audited by leading security firms\n- Multi-signature treasury protection\n- Insurance fund for extreme scenarios\n- Transparent operations and regular audits\n\n**Best Practices:**\n- Only stake amounts you're comfortable with\n- Consider diversifying your lock periods\n- Monitor market conditions if planning to sell\n- Understand that longer locks offer better rates but less flexibility",
    tags: ["risk", "safety", "investing"],
    helpful: 58,
    lastUpdated: "2024-11-12"
  },
  {
    id: "7",
    category: "payments",
    question: "How do I withdraw my earnings and what are the fees?",
    answer: "Withdrawing your earnings is straightforward:\n\n**Withdrawal Process:**\n1. Go to the Withdraw page\n2. Add your PayPal email address\n3. Enter the withdrawal amount\n4. Review fees and confirm\n5. Receive funds within 24 hours\n\n**Fee Structure:**\n- Platform fee: 2% of withdrawal amount\n- PayPal fees: As per PayPal's standard rates\n- No minimum withdrawal amount\n\n**KYC Withdrawal Limits:**\n- **Level 0:** $50 per day\n- **Level 1:** $200 per day\n- **Level 2:** $1,000 per day\n\n**Processing Times:**\n- Standard: 24 hours\n- Priority (Level 2 KYC): 2-4 hours\n- Emergency support available for urgent cases",
    tags: ["withdrawal", "fees", "paypal"],
    helpful: 84,
    lastUpdated: "2024-11-16"
  },
  {
    id: "8",
    category: "payments",
    question: "What payment methods are supported?",
    answer: "We support several payment methods for your convenience:\n\n**Current Payment Methods:**\n- **PayPal:** Primary withdrawal method\n- **Stripe:** For deposits and purchases\n- **Bank Transfer:** Available for Level 2 KYC users\n- **Crypto Withdrawals:** Coming soon\n\n**Payment Regions:**\n- Global PayPal support\n- Bank transfers for major countries\n- Expanding to additional regions monthly\n\n**Future Additions:**\n- Direct bank transfers (ACH, SEPA)\n- Additional crypto wallets\n- Credit/debit card processing\n- Mobile payment solutions\n\n**Currency Support:**\n- USD, EUR, GBP for fiat\n- Major cryptocurrencies for crypto transactions",
    tags: ["payment", "paypal", "stripe"],
    helpful: 61,
    lastUpdated: "2024-11-14"
  },
  {
    id: "9",
    category: "security",
    question: "How do I enable two-factor authentication (2FA)?",
    answer: "Enabling 2FA is highly recommended for account security:\n\n**Setup Steps:**\n1. Go to Settings → Security\n2. Click 'Enable Two-Factor Authentication'\n3. Download an authenticator app (Google Authenticator, Authy, 1Password)\n4. Scan the QR code with your authenticator app\n5. Enter the 6-digit code to verify\n6. Save your backup codes in a secure location\n\n**Recommended Authenticator Apps:**\n- Google Authenticator (iOS/Android)\n- Authy (iOS/Android/Desktop)\n- 1Password (premium feature)\n- Microsoft Authenticator\n\n**Backup Options:**\n- Save backup codes securely\n- Enable multiple trusted devices\n- Store recovery keys safely\n\n**Lost Access:**\nContact support with your backup codes for account recovery.",
    tags: ["2fa", "security", "authentication"],
    helpful: 73,
    lastUpdated: "2024-11-15"
  },
  {
    id: "10",
    category: "rewards",
    question: "How does the referral program work?",
    answer: "Our referral program rewards you for bringing new users:\n\n**Referral Tiers:**\n- **Standard Referrals:** 50 MINER tokens per active user\n- **Super Affiliates:** 100 MINER tokens (10+ referrals)\n- **Elite Partners:** 200 MINER tokens (50+ referrals)\n\n**How It Works:**\n1. Get your unique referral link from the Referrals page\n2. Share your link with friends, family, or your audience\n3. When someone signs up using your link and starts mining\n4. You'll automatically receive bonus tokens\n5. Track all referrals in your referral dashboard\n\n**Bonus Features:**\n- Lifetime earnings from active referrals\n- Multi-tier bonuses for top performers\n- Special contests and promotions\n- Marketing materials and support\n\n**Payouts:**\n- Referral bonuses paid instantly in MINER tokens\n- No minimum requirements\n- Unlimited referral potential",
    tags: ["referral", "bonus", "earnings"],
    helpful: 88,
    lastUpdated: "2024-11-13"
  }
]

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({})

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = !selectedCategory || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleExpanded = (faqId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(faqId)) {
      newExpanded.delete(faqId)
    } else {
      newExpanded.add(faqId)
    }
    setExpandedItems(newExpanded)
  }

  const handleHelpfulVote = (faqId: string, helpful: boolean) => {
    setHelpfulVotes(prev => ({ ...prev, [faqId]: helpful }))
    // In a real app, this would send the vote to the server
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl">
            MINER
          </Link>
          <div className="flex gap-4">
            <Link href="/help" className="hover:text-primary">
              Help
            </Link>
            <Link href="/faq" className="text-primary font-semibold">
              FAQ
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Find quick answers to common questions about MINER
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Browse by Category</h2>
            {selectedCategory && (
              <Button
                variant="outline"
                onClick={() => setSelectedCategory(null)}
                className="text-sm"
              >
                Clear Filter
              </Button>
            )}
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {categories.map((category) => {
              const Icon = category.icon
              const faqCount = faqs.filter(faq => faq.category === category.id).length
              const isSelected = selectedCategory === category.id

              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isSelected ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg bg-background ${category.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{category.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {category.description}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {faqCount} questions
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* FAQ Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              {selectedCategory
                ? `${categories.find(c => c.id === selectedCategory)?.name} Questions`
                : "All Questions"
              }
            </h2>
            <span className="text-muted-foreground">
              {filteredFAQs.length} {filteredFAQs.length === 1 ? 'result' : 'results'}
            </span>
          </div>

          {filteredFAQs.map((faq) => {
            const isExpanded = expandedItems.has(faq.id)
            const hasVoted = helpfulVotes[faq.id] !== undefined

            return (
              <Card key={faq.id} className="overflow-hidden">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Question */}
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => toggleExpanded(faq.id)}
                    >
                      <h3 className="font-semibold text-lg pr-4 flex items-start gap-2">
                        <HelpCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        {faq.question}
                      </h3>
                      <Button variant="ghost" size="sm" className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {/* Expanded Answer */}
                    {isExpanded && (
                      <div className="space-y-4 pl-7">
                        <div className="prose prose-sm max-w-none">
                          {faq.answer.split('\n').map((paragraph, idx) => (
                            <p key={idx} className="text-muted-foreground leading-relaxed">
                              {paragraph}
                            </p>
                          ))}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {faq.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Helpful Section */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            {faq.helpful} people found this helpful
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Was this helpful?</span>
                            <Button
                              variant={helpfulVotes[faq.id] === true ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleHelpfulVote(faq.id, true)}
                              disabled={hasVoted}
                              className="text-xs"
                            >
                              Yes
                            </Button>
                            <Button
                              variant={helpfulVotes[faq.id] === false ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleHelpfulVote(faq.id, false)}
                              disabled={hasVoted}
                              className="text-xs"
                            >
                              No
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No FAQs Found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or browse different categories
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory(null)
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Still Need Help */}
        <Card className="mt-12">
          <CardContent className="pt-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Still Need Help?</h3>
            <p className="text-muted-foreground mb-6">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Start Live Chat
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Support
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Visit Help Center
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}