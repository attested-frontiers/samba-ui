'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-1">
            <img src="/samba-logo.png" alt="Samba" className="w-12 h-12" />
            <span className="text-xl font-bold text-gray-900">Samba</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                Back to Home
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The terms and conditions governing your use of Samba
          </p>
        </div>

        {/* Terms of Service Content */}
        <Card className="shadow-xl border-0 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="text-lg font-semibold mb-3">Coming Soon</h3>
                <p className="leading-relaxed">
                  We are currently preparing comprehensive terms of service that will outline the rules, responsibilities, and guidelines for using Samba's cross-border payment platform.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">What We're Working On</h3>
                <p className="leading-relaxed mb-3">
                  Our terms of service will cover:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>User responsibilities and acceptable use policies</li>
                  <li>Service availability and limitations</li>
                  <li>Transaction rules and dispute resolution</li>
                  <li>Account management and security requirements</li>
                  <li>Liability limitations and disclaimers</li>
                  <li>Compliance with financial regulations</li>
                  <li>Intellectual property rights</li>
                  <li>Service modifications and termination policies</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Current Status</h3>
                <p className="leading-relaxed">
                  Samba is currently in alpha/MVP stage. By using our service, you acknowledge that this is experimental software and should be used with caution. We are committed to providing a secure and reliable service while we finalize our formal terms.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Alpha Stage Notice</h3>
                <p className="leading-relaxed">
                  During our alpha phase, we have implemented restrictive transaction limits and additional safety measures. Our team manually monitors transactions and is available to assist with any issues that may arise.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Questions?</h3>
                <p className="leading-relaxed">
                  If you have any questions about our terms of service or need clarification on any aspect of using Samba, please contact us through our{' '}
                  <Link href="https://t.me/attestedfrontier/2" target="_blank" className="text-primary hover:text-primary/80 underline">
                    Telegram support group
                  </Link>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-0">
            <CardContent className="py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Stay Informed
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We'll update this page once our comprehensive terms of service are ready.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="https://t.me/attestedfrontier/2" target="_blank">
                  <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80">
                    Join for Updates
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t mt-16">
        <div className="text-center text-gray-600">
          <p>&copy; 2024 Samba. All rights reserved.</p>
          <div className="flex justify-center space-x-6 mt-4">
            <Link href="/faq" className="hover:text-primary transition-colors">
              FAQ
            </Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="https://t.me/attestedfrontier/2" target="_blank" className="hover:text-primary transition-colors">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}