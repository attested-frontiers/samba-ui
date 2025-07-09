'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            How we collect, use, and protect your personal information
          </p>
        </div>

        {/* Privacy Policy Content */}
        <Card className="shadow-xl border-0 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="text-lg font-semibold mb-3">Coming Soon</h3>
                <p className="leading-relaxed">
                  We are currently preparing a comprehensive privacy policy that will detail how Samba collects, uses, stores, and protects your personal information.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">What We're Working On</h3>
                <p className="leading-relaxed mb-3">
                  Our privacy policy will cover:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Information collection and usage practices</li>
                  <li>Data protection and security measures</li>
                  <li>Cookie and tracking technology policies</li>
                  <li>Third-party integrations and data sharing</li>
                  <li>User rights and data control options</li>
                  <li>Compliance with privacy regulations (GDPR, CCPA, etc.)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Current Practices</h3>
                <p className="leading-relaxed">
                  While we finalize our formal privacy policy, please know that we are committed to protecting your privacy and handling your data responsibly. We only collect information necessary to provide our services and never sell your personal information to third parties.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Questions?</h3>
                <p className="leading-relaxed">
                  If you have any questions about our privacy practices, please don't hesitate to contact us through our{' '}
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
                Stay Updated
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We'll update this page once our comprehensive privacy policy is ready.
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