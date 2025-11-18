"use client"

import type React from "react"

import Link from "next/link"
import { FileText, Shield, AlertCircle, Users, DollarSign, Lock, Scale, Calendar, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl">
            MINER
          </Link>
          <div className="flex gap-4">
            <Link href="/help" className="hover:text-primary">
              Help
            </Link>
            <Link href="/faq" className="hover:text-primary">
              FAQ
            </Link>
            <Link href="/terms" className="text-primary font-semibold">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-primary">
              Privacy
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-lg text-muted-foreground mb-2">
            Last updated: {currentDate}
          </p>
          <p className="text-muted-foreground">
            By using MINER, you agree to these terms and conditions. Please read them carefully.
          </p>
        </div>

        {/* Key Points Summary */}
        <Card className="mb-8 border-primary">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Key Points Summary
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>You must be 18+ or have parental consent</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Mining rewards are not guaranteed</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Platform fees apply to withdrawals (2%)</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>You're responsible for account security</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Token values can fluctuate significantly</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Terms can be updated with notice</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="prose prose-lg max-w-none space-y-8">
          {/* Agreement to Terms */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Scale className="w-6 h-6 text-primary" />
              1. Agreement to Terms
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                By accessing and using MINER (the "Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
              <p>
                These Terms of Service ("Terms") govern your use of MINER's cryptocurrency mining and staking platform, website, and related services (collectively, the "Service").
              </p>
            </div>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              2. Eligibility
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                You must be at least 18 years of age to use this Service. By using this Service, you represent and warrant that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You are at least 18 years of age</li>
                <li>You are capable of entering into a legally binding agreement</li>
                <li>You comply with all applicable laws and regulations</li>
                <li>You are not located in any jurisdiction where using this Service would be illegal</li>
                <li>You will not use this Service for any illegal or unauthorized purpose</li>
              </ul>
              <p>
                If you are under 18, you may only use this Service with the involvement of a parent or guardian who agrees to be bound by these Terms.
              </p>
            </div>
          </section>

          {/* Account Responsibilities */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              3. Account Responsibilities
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                To access certain features of the Service, you must register for an account. You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Providing accurate and up-to-date information</li>
                <li>Complying with KYC and verification requirements</li>
              </ul>
              <p>
                We are not liable for any loss or damage arising from your failure to comply with these obligations.
              </p>
            </div>
          </section>

          {/* Mining and Staking */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-primary" />
              4. Mining and Staking Activities
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <h3 className="font-semibold text-foreground">Mining Activities</h3>
              <p>
                Mining rewards are based on computational contribution, task completion, and network participation. Mining rewards:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Are not guaranteed and may vary based on network conditions</li>
                <li>Are calculated based on fair algorithms and contribution metrics</li>
                <li>May be adjusted based on network difficulty and participation</li>
                <li>Are subject to platform fees and transaction costs</li>
              </ul>

              <h3 className="font-semibold text-foreground mt-6">Staking Activities</h3>
              <p>
                Staking allows you to earn rewards by locking tokens for specified periods. Staking:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Offers variable APY rates based on lock period and market conditions</li>
                <li>Requires tokens to be locked for the specified duration</li>
                <li>May include penalties for early withdrawal from fixed-term stakes</li>
                <li>Is subject to smart contract risks and market volatility</li>
              </ul>
            </div>
          </section>

          {/* Financial Risks */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-primary" />
              5. Financial Risks and Disclaimers
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="font-semibold text-foreground">Risk Disclosure</p>
              <p>
                Cryptocurrency activities involve significant financial risks. You acknowledge and understand that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cryptocurrency values are highly volatile and can change rapidly</li>
                <li>Past performance does not indicate future results</li>
                <li>You may lose all or part of your investment</li>
                <li>Mining rewards are not guaranteed and may fluctuate</li>
                <li>Smart contract vulnerabilities may result in loss of funds</li>
                <li>Regulatory changes may affect the Service and token value</li>
              </ul>

              <p className="font-semibold text-foreground mt-6">No Investment Advice</p>
              <p>
                Nothing on this Platform constitutes investment advice, financial advice, trading advice, or any other type of advice. You should consult with a qualified financial advisor before making any investment decisions.
              </p>

              <p className="font-semibold text-foreground mt-6">No Warranty</p>
              <p>
                The Service is provided "as is" without warranties of any kind. We disclaim all warranties, whether express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.
              </p>
            </div>
          </section>

          {/* Fees and Payments */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-primary" />
              6. Fees and Payments
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <h3 className="font-semibold text-foreground">Platform Fees</h3>
              <p>
                MINER charges the following fees:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Withdrawal Fees:</strong> 2% platform fee on all withdrawals</li>
                <li><strong>Transaction Fees:</strong> Network gas fees for blockchain transactions</li>
                <li><strong>Payment Processor Fees:</strong> Fees charged by third-party payment providers</li>
              </ul>

              <h3 className="font-semibold text-foreground mt-6">Payment Terms</h3>
              <p>
                All payments are final and non-refundable except as required by law. You are responsible for any taxes related to your earnings from the Service.
              </p>
            </div>
          </section>

          {/* Privacy and Data */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6 text-primary" />
              7. Privacy and Data Protection
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
              </p>
              <p>
                By using this Service, you consent to the collection, use, and sharing of your information as described in our Privacy Policy.
              </p>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              8. Intellectual Property
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                The Service and its original content, features, and functionality are owned by MINER and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p>
                You may not modify, reproduce, distribute, create derivative works, publicly display, or perform any part of the Service without our prior written consent.
              </p>
            </div>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-primary" />
              9. Prohibited Activities
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                You may not use the Service for any unlawful purpose or in any way that could damage, disable, or impair the Service. Prohibited activities include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Using automated bots or scripts to exploit the Service</li>
                <li>Attempting to gain unauthorized access to our systems</li>
                <li>Engaging in fraudulent or deceptive practices</li>
                <li>Violating applicable laws or regulations</li>
                <li>Interfering with other users' use of the Service</li>
                <li>Uploading malicious code or viruses</li>
                <li>Spamming or sending unsolicited communications</li>
              </ul>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              10. Limitation of Liability
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                To the maximum extent permitted by law, MINER shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
              <p>
                Our total liability to you for all claims arising from or relating to the Service shall not exceed the amount you have paid to us in the twelve (12) months preceding the claim.
              </p>
            </div>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-primary" />
              11. Termination
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including if you breach the Terms.
              </p>
              <p>
                Upon termination, your right to use the Service will cease immediately. All provisions of the Terms which by their nature should survive termination shall survive termination.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              12. Changes to Terms
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                We reserve the right to modify these Terms at any time. If we make material changes, we will notify you by email or by posting a notice on the Service prior to the effective date of the changes.
              </p>
              <p>
                Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
              </p>
            </div>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Scale className="w-6 h-6 text-primary" />
              13. Governing Law
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which MINER operates, without regard to its conflict of law provisions.
              </p>
              <p>
                Any disputes arising from these Terms shall be resolved through arbitration in accordance with the rules of the relevant arbitration association.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              14. Contact Information
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="bg-background border rounded-lg p-4">
                <p><strong>Email:</strong> legal@miner.com</p>
                <p><strong>Support:</strong> support@miner.com</p>
                <p><strong>Website:</strong> https://miner.com</p>
              </div>
            </div>
          </section>
        </div>

        {/* Acceptance Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Acceptance of Terms
            </CardTitle>
            <CardDescription>
              By continuing to use the MINER platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild>
                <Link href="/signup">I Agree - Create Account</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/privacy">Read Privacy Policy</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}