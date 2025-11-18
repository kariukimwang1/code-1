"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Search, BookOpen, MessageCircle, Video, FileText, ExternalLink, ChevronDown, ChevronRight, Mail, HeadphonesIcon, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface FAQ {
  id: string
  category: string
  question: string
  answer: string
  helpful: number
}

interface Guide {
  id: string
  title: string
  description: string
  category: string
  readTime: string
  link: string
}

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const faqs: FAQ[] = [
    {
      id: "1",
      category: "Getting Started",
      question: "How do I create an account?",
      answer: "Creating an account is simple. Click the 'Sign Up' button on the homepage, enter your email address and create a password. You'll receive a verification email - click the link to verify your account and you're ready to start mining!",
      helpful: 45
    },
    {
      id: "2",
      category: "Getting Started",
      question: "What is MINER token?",
      answer: "MINER is our native utility token that powers the ecosystem. You earn MINER tokens through mining activities, staking, and referrals. The token has a fixed supply of 1 billion tokens and can be used for staking, governance, and exchanged for other cryptocurrencies.",
      helpful: 38
    },
    {
      id: "3",
      category: "Mining",
      question: "How does mining work?",
      answer: "Mining involves completing computational tasks and contributing to the network. Simply go to the Mining page, select available tasks, and submit your work. You'll earn MINER tokens based on task difficulty and completion quality. The more you mine, the higher your earning potential.",
      helpful: 52
    },
    {
      id: "4",
      category: "Mining",
      question: "What are the system requirements for mining?",
      answer: "Basic mining requires a modern computer with internet connection. For optimal performance, we recommend: 8GB+ RAM, multi-core processor, and stable internet. Mobile devices can be used for basic tasks and monitoring.",
      helpful: 29
    },
    {
      id: "5",
      category: "Staking",
      question: "How does staking work?",
      answer: "Staking allows you to earn passive income by locking your MINER tokens for a set period. Go to the Staking page, choose your lock period (Flexible, 30, 60, or 90 days), and stake your tokens. Longer lock periods offer higher APY rates up to 25%.",
      helpful: 41
    },
    {
      id: "6",
      category: "Staking",
      question: "Can I unstake my tokens early?",
      answer: "Flexible staking allows immediate unstaking. Fixed-term stakes (30/60/90 days) must complete the full period to avoid penalties. Early unstaking from fixed terms results in a 10% penalty on earned rewards.",
      helpful: 33
    },
    {
      id: "7",
      category: "Payments",
      question: "How do I withdraw my earnings?",
      answer: "Navigate to the Withdraw page, enter your PayPal email address and withdrawal amount. Your KYC level determines daily limits ($50-$1000). Withdrawals are typically processed within 24 hours. A 2% platform fee applies.",
      helpful: 47
    },
    {
      id: "8",
      category: "Payments",
      question: "What payment methods are supported?",
      answer: "We currently support PayPal for withdrawals and Stripe for deposits. Additional payment methods including bank transfers and cryptocurrency withdrawals are being developed.",
      helpful: 25
    },
    {
      id: "9",
      category: "Security",
      question: "How do I enable two-factor authentication?",
      answer: "Go to Settings → Security → Enable 2FA. Download an authenticator app (Google Authenticator, Authy), scan the QR code, and enter the verification code. Keep your backup codes safe!",
      helpful: 36
    },
    {
      id: "10",
      category: "Account",
      question: "How do I upgrade my KYC level?",
      answer: "KYC Level 0 is automatic with email verification. Level 1 requires phone verification. Level 2 requires document verification (passport/national ID). Higher levels unlock increased withdrawal limits and platform features.",
      helpful: 42
    }
  ]

  const guides: Guide[] = [
    {
      id: "1",
      title: "Complete Mining Guide",
      description: "Learn everything about mining MINER tokens, from basic setup to advanced strategies.",
      category: "Mining",
      readTime: "8 min",
      link: "#"
    },
    {
      id: "2",
      title: "Staking for Beginners",
      description: "Understand how to maximize your earnings through staking.",
      category: "Staking",
      readTime: "5 min",
      link: "#"
    },
    {
      id: "3",
      title: "Referral Program Mastery",
      description: "Learn how to earn bonuses by referring new users to the platform.",
      category: "Referrals",
      readTime: "6 min",
      link: "#"
    },
    {
      id: "4",
      title: "Security Best Practices",
      description: "Essential security tips to keep your account and earnings safe.",
      category: "Security",
      readTime: "7 min",
      link: "#"
    },
    {
      id: "5",
      title: "Understanding KYC",
      description: "Complete guide to Know Your Customer verification and benefits.",
      category: "Account",
      readTime: "4 min",
      link: "#"
    },
    {
      id: "6",
      title: "Tax Guide for Miners",
      description: "Understand tax implications of your mining and staking earnings.",
      category: "Legal",
      readTime: "10 min",
      link: "#"
    }
  ]

  const categories = ["all", "Getting Started", "Mining", "Staking", "Payments", "Security", "Account"]

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredGuides = guides.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guide.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleFAQHelpful = (faqId: string, helpful: boolean) => {
    // Simulate marking FAQ as helpful
    console.log(`FAQ ${faqId} marked as ${helpful ? 'helpful' : 'not helpful'}`)
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
            <Link href="/dashboard" className="hover:text-primary">
              Dashboard
            </Link>
            <Link href="/help" className="text-primary font-semibold">
              Help
            </Link>
            <Link href="/faq" className="hover:text-primary">
              FAQ
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Find answers, guides, and support for all your MINER questions
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for help articles, guides, and FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6 text-center">
              <MessageCircle className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Live Chat</h3>
              <p className="text-sm text-muted-foreground">Chat with our support team</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6 text-center">
              <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Email Support</h3>
              <p className="text-sm text-muted-foreground">Get help via email</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6 text-center">
              <Video className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Video Tutorials</h3>
              <p className="text-sm text-muted-foreground">Watch step-by-step guides</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6 text-center">
              <BookOpen className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Documentation</h3>
              <p className="text-sm text-muted-foreground">Read detailed guides</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Frequently Asked Questions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>Quick answers to common questions</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="text-xs"
                    >
                      {category === "all" ? "All Categories" : category}
                    </Button>
                  ))}
                </div>

                {/* FAQ List */}
                <div className="space-y-4">
                  {filteredFAQs.map((faq) => (
                    <Card key={faq.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold pr-4">{faq.question}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                          >
                            {expandedFAQ === faq.id ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        {expandedFAQ === faq.id && (
                          <div className="mt-4 space-y-4">
                            <p className="text-muted-foreground leading-relaxed">
                              {faq.answer}
                            </p>
                            <div className="flex items-center gap-4 pt-4 border-t">
                              <span className="text-sm text-muted-foreground">Was this helpful?</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFAQHelpful(faq.id, true)}
                                className="text-xs"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Yes ({faq.helpful})
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFAQHelpful(faq.id, false)}
                                className="text-xs"
                              >
                                <AlertCircle className="w-3 h-3 mr-1" />
                                No
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredFAQs.length === 0 && (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No FAQs found matching your search</p>
                    <p className="text-sm text-muted-foreground">Try different keywords or browse categories</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Guides */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Helpful Guides
                </CardTitle>
                <CardDescription>Step-by-step tutorials and in-depth guides</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {filteredGuides.map((guide) => (
                    <Card key={guide.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{guide.title}</h3>
                              <Badge variant="secondary" className="text-xs">
                                {guide.category}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mb-3">{guide.description}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {guide.readTime}
                              </span>
                              <span className="flex items-center gap-1 text-primary">
                                Read more
                                <ExternalLink className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredGuides.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No guides found matching your search</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/mining" className="flex items-center gap-2 text-sm hover:text-primary">
                  <ChevronRight className="w-4 h-4" />
                  Start Mining
                </Link>
                <Link href="/staking" className="flex items-center gap-2 text-sm hover:text-primary">
                  <ChevronRight className="w-4 h-4" />
                  Stake Tokens
                </Link>
                <Link href="/referrals" className="flex items-center gap-2 text-sm hover:text-primary">
                  <ChevronRight className="w-4 h-4" />
                  Referral Program
                </Link>
                <Link href="/withdraw" className="flex items-center gap-2 text-sm hover:text-primary">
                  <ChevronRight className="w-4 h-4" />
                  Withdraw Earnings
                </Link>
                <Link href="/settings" className="flex items-center gap-2 text-sm hover:text-primary">
                  <ChevronRight className="w-4 h-4" />
                  Account Settings
                </Link>
              </CardContent>
            </Card>

            {/* Support Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <HeadphonesIcon className="w-5 h-5" />
                  Still Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Our support team is here to help you 24/7
                </p>
                <div className="space-y-2">
                  <Button className="w-full flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Start Live Chat
                  </Button>
                  <Button variant="outline" className="w-full flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Support
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Average response time: 2 hours
                </div>
              </CardContent>
            </Card>

            {/* Community */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Community</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Join our community for tips, updates, and support from other miners
                </p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" size="sm">
                    Discord Server
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    Telegram Group
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    Twitter/X
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}