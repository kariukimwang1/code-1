"use client"

import type React from "react"

import Link from "next/link"
import { Shield, Lock, Eye, Database, Users, Cookie, FileText, CheckCircle, AlertTriangle, Mail, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPage() {
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
            <Link href="/terms" className="hover:text-primary">
              Terms
            </Link>
            <Link href="/privacy" className="text-primary font-semibold">
              Privacy
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-lg text-muted-foreground mb-2">
            Last updated: {currentDate}
          </p>
          <p className="text-muted-foreground">
            At MINER, we are committed to protecting your privacy and ensuring the security of your personal information.
          </p>
        </div>

        {/* Privacy Commitment Card */}
        <Card className="mb-8 border-green-500 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Our Privacy Commitment
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>We never sell your personal data to third parties</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Bank-level encryption protects your information</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>You control what data we collect and how it's used</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>GDPR and CCPA compliant data practices</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Transparent data usage and sharing policies</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Regular security audits and updates</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="prose prose-lg max-w-none space-y-8">
          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Database className="w-6 h-6 text-primary" />
              1. Information We Collect
            </h2>
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Personal Information</h3>
              <p className="text-muted-foreground">
                When you create an account or use our services, we may collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Name, email address, and contact information</li>
                <li>Date of birth and age verification information</li>
                <li>Government-issued ID for KYC verification</li>
                <li>Phone number and address verification details</li>
                <li>Wallet addresses for cryptocurrency transactions</li>
                <li>Financial information for payment processing</li>
              </ul>

              <h3 className="font-semibold text-foreground">Technical Information</h3>
              <p className="text-muted-foreground">
                We automatically collect certain technical information when you use our platform:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>IP address, browser type, and device information</li>
                <li>Operating system and device identifiers</li>
                <li>Pages visited, time spent, and interaction patterns</li>
                <li>Mining performance and activity data</li>
                <li>Error logs and crash reports</li>
                <li>Cookie and tracking data</li>
              </ul>

              <h3 className="font-semibold text-foreground">Usage Analytics</h3>
              <p className="text-muted-foreground">
                We collect aggregated usage data to improve our services:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Mining activity and earnings patterns</li>
                <li>Staking preferences and behaviors</li>
                <li>Feature usage and engagement metrics</li>
                <li>Platform performance and reliability data</li>
              </ul>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-primary" />
              2. How We Use Your Information
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                We use your information for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Account Management:</strong> Creating and maintaining your account, providing customer support</li>
                <li><strong>Service Delivery:</strong> Facilitating mining, staking, and transaction processing</li>
                <li><strong>Security:</strong> Verifying identity, preventing fraud, and ensuring platform security</li>
                <li><strong>Legal Compliance:</strong> Complying with KYC, AML, and regulatory requirements</li>
                <li><strong>Communication:</strong> Sending service updates, security alerts, and support responses</li>
                <li><strong>Analytics:</strong> Analyzing usage patterns to improve our services</li>
                <li><strong>Marketing:</strong> Sending promotional content (with your consent)</li>
              </ul>
            </div>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              3. Information Sharing and Disclosure
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                We do not sell your personal information. We only share your data in limited circumstances:
              </p>

              <h3 className="font-semibold text-foreground">Service Providers</h3>
              <p className="text-muted-foreground">
                We share information with trusted third-party service providers who help us operate our platform:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Payment processors (Stripe, PayPal)</li>
                <li>KYC verification services</li>
                <li>Cloud hosting and infrastructure providers</li>
                <li>Analytics and monitoring services</li>
                <li>Email and communication services</li>
              </ul>

              <h3 className="font-semibold text-foreground">Legal Requirements</h3>
              <p className="text-muted-foreground">
                We may disclose your information when required by law or to protect our rights:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Compliance with legal obligations</li>
                <li>Protecting our rights and property</li>
                <li>Preventing fraud or illegal activity</li>
                <li>Ensuring platform security and integrity</li>
              </ul>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6 text-primary" />
              4. Data Security
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                We implement robust security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Encryption:</strong> End-to-end encryption for sensitive data transmission</li>
                <li><strong>Storage:</strong> Encrypted databases and secure storage solutions</li>
                <li><strong>Access Controls:</strong> Strict access controls and authentication systems</li>
                <li><strong>Regular Audits:</strong> Third-party security assessments and penetration testing</li>
                <li><strong>Compliance:</strong> Adherence to industry security standards and best practices</li>
                <li><strong>Monitoring:</strong> 24/7 security monitoring and threat detection</li>
              </ul>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Important Security Note
                </h4>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  While we take comprehensive security measures, no method of transmission over the internet is 100% secure.
                  We recommend enabling two-factor authentication and using strong, unique passwords.
                </p>
              </div>
            </div>
          </section>

          {/* Cookies and Tracking */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Cookie className="w-6 h-6 text-primary" />
              5. Cookies and Tracking Technologies
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to enhance your experience:
              </p>

              <h3 className="font-semibold text-foreground">Essential Cookies</h3>
              <p className="text-muted-foreground">
                Required for basic functionality and security:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Session management and authentication</li>
                <li>Security and fraud prevention</li>
                <li>Platform functionality and performance</li>
              </ul>

              <h3 className="font-semibold text-foreground">Analytics Cookies</h3>
              <p className="text-muted-foreground">
                Help us understand how you use our platform:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Website usage and performance analytics</li>
                <li>User behavior and interaction patterns</li>
                <li>Error tracking and optimization</li>
              </ul>

              <h3 className="font-semibold text-foreground">Marketing Cookies</h3>
              <p className="text-muted-foreground">
                Used for personalized advertising and content (with your consent):
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Personalized content and recommendations</li>
                <li>Social media integration and sharing</li>
                <li>Promotional content and offers</li>
              </ul>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              6. Your Privacy Rights
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Restriction:</strong> Limit how we use your information</li>
                <li><strong>Objection:</strong> Object to certain processing activities</li>
                <li><strong>Withdraw Consent:</strong> Revoke consent for data processing</li>
              </ul>

              <p className="text-muted-foreground">
                To exercise these rights, please contact our privacy team using the information below.
              </p>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Database className="w-6 h-6 text-primary" />
              7. Data Retention
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                We retain your information only as long as necessary:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Active Accounts:</strong> Retained while you use our services</li>
                <li><strong>Legal Requirements:</strong> Retained to comply with legal obligations</li>
                <li><strong>Legitimate Interests:</strong> Retained for legitimate business purposes</li>
                <li><strong>Deleted Accounts:</strong> Most data deleted within 30 days</li>
                <li><strong>Analytics Data:</strong> Anonymized after 13 months</li>
              </ul>
            </div>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              8. Children's Privacy
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Our services are not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18.
                If you believe we have collected information from a child under 18, please contact us immediately.
              </p>
            </div>
          </section>

          {/* International Transfers */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Database className="w-6 h-6 text-primary" />
              9. International Data Transfers
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than your own. We ensure adequate protection through:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Standard contractual clauses (SCCs)</li>
                <li>Adequacy decisions where applicable</li>
                <li>Binding corporate rules</li>
                <li>Other appropriate safeguards under applicable law</li>
              </ul>
            </div>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              10. Changes to This Privacy Policy
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. When we make changes, we will:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Post the updated policy on our website</li>
                <li>Update the "Last updated" date</li>
                <li>Notify users of significant changes via email</li>
                <li>Obtain consent where required by law</li>
              </ul>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-6 h-6 text-primary" />
              11. Contact Us
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy or our data practices, please contact our privacy team:
              </p>

              <Card>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        <span><strong>Email:</strong> privacy@miner.com</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-primary" />
                        <span><strong>Phone:</strong> +1 (555) 123-4567</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span><strong>Address:</strong> Privacy Team, MINER Inc.</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-muted-foreground">
                        <strong>Response Times:</strong>
                      </p>
                      <ul className="list-disc pl-6 text-sm text-muted-foreground">
                        <li>Data access requests: 30 days</li>
                        <li>General inquiries: 5-7 business days</li>
                        <li>Urgent requests: 48 hours</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>

        {/* Action Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Manage Your Privacy
            </CardTitle>
            <CardDescription>
              Take control of your privacy settings and data preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild>
                <Link href="/settings">Privacy Settings</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/terms">View Terms of Service</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/help">Contact Support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}