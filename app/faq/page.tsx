'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface FAQItemProps {
  id: string;
  question: string;
  answer: string;
}

function FAQItem({ id, question, answer }: FAQItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card id={id} className="mb-4 shadow-lg border-0 scroll-mt-8">
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {question}
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="text-gray-700 leading-relaxed whitespace-pre-line">
            {answer}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function FAQPage() {
  const faqItems = [
    {
      id: 'what-is-samba',
      question: 'What is Samba?',
      answer: 'Samba is a cross-border payment platform that enables seamless money transfers between different payment providers like Venmo and Revolut. Using advanced zero-knowledge proof technology, we ensure fast, secure, and transparent transactions with minimal fees.'
    },
    {
      id: 'how-does-it-work',
      question: 'How does Samba work?',
      answer: 'Samba works by connecting different payment platforms through blockchain technology. When you initiate a transfer, our system:\n\n1. Creates a secure payment intent on the blockchain\n2. Matches you with a recipient on the target platform\n3. Verifies the payment using zero-knowledge proofs\n4. Completes the transfer to the recipient\n\nThis process typically takes just a few minutes and provides full transparency through blockchain verification.'
    },
    {
      id: 'supported-platforms',
      question: 'Which payment platforms are supported?',
      answer: 'Currently, Samba supports transfers between:\n\n• Venmo (USD)\n• Revolut (USD, with EUR and GBP coming soon)\n\nWe are continuously working to add more payment providers and currencies to expand our global reach.'
    },
    {
      id: 'fees-and-rates',
      question: 'What are the fees and exchange rates?',
      answer: 'Samba offers competitive fees and transparent pricing:\n\n• Transaction fees: Typically 1-3% of the transfer amount\n• Exchange rates: Real-time market rates with minimal markup\n• No hidden fees: All costs are displayed upfront before confirmation\n\nThe exact fee structure depends on the payment platforms and currencies involved in your transfer.'
    },
    {
      id: 'security',
      question: 'How secure is Samba?',
      answer: 'Security is our top priority. Samba uses:\n\n• Zero-knowledge proofs to verify transactions without exposing sensitive data\n• Blockchain technology for immutable transaction records\n• End-to-end encryption for all communications\n• Multi-factor authentication for account access\n• Regular security audits and compliance checks\n\nYour funds and personal information are protected with bank-level security measures.'
    },
    {
      id: 'transaction-limits',
      question: 'Are there any transaction limits?',
      answer: 'Yes, we have the following limits in place:\n\n• Minimum transfer: $0.10\n• Maximum transfer: $10,000 per transaction\n• Daily limits may apply based on your account verification level\n\nThese limits help ensure compliance with financial regulations and maintain platform security.'
    },
    {
      id: 'processing-time',
      question: 'How long do transfers take?',
      answer: 'Most Samba transfers are completed quickly:\n\n• Payment verification: 1-2 minutes\n• Blockchain confirmation: 2-5 minutes\n• Recipient notification: Immediate\n• Total processing time: Typically 5-10 minutes\n\nProcessing times may vary depending on network congestion and payment platform response times.'
    },
    {
      id: 'getting-started',
      question: 'How do I get started?',
      answer: 'Getting started with Samba is simple:\n\n1. Sign in with your Google account\n2. Connect your payment accounts (Venmo, Revolut, etc.)\n3. Enter transfer details and recipient information\n4. Review and confirm the transaction\n5. Complete the payment through your chosen platform\n\nThe entire process is guided and user-friendly, with support available if you need help.'
    },
    {
      id: 'support',
      question: 'How can I get help or support?',
      answer: 'We offer multiple ways to get assistance:\n\n• Email support: Contact us through our support portal\n• Documentation: Comprehensive guides and tutorials\n• Community: Join our Discord or Telegram channels\n• Status page: Check system status and announcements\n\nOur support team typically responds within 24 hours during business days.'
    }
  ];

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
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about Samba and cross-border payments
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqItems.map((item) => (
            <FAQItem
              key={item.id}
              id={item.id}
              question={item.question}
              answer={item.answer}
            />
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-0">
            <CardContent className="py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Still have questions?
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Can't find the answer you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => window.location.href = 'mailto:support@samba.com'}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80"
                >
                  Contact Support
                </Button>
                <Link href="/">
                  <Button variant="outline">
                    Get Started
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
            <Link href="#" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}