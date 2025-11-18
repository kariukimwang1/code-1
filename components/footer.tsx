import Link from "next/link"
import { Github, Twitter, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold mb-4">MINER</h3>
            <p className="text-foreground/60 text-sm">The transparent token economy for legitimate earning.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-foreground/60">
              <li>
                <Link href="/" className="hover:text-primary">
                  Tasks
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-primary">
                  Staking
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-primary">
                  Referrals
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-foreground/60">
              <li>
                <Link href="/" className="hover:text-primary">
                  About
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-primary">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Follow</h4>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-foreground/60">
          <p>&copy; 2025 MINER. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/" className="hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-primary">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
