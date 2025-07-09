'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Function to render text with markdown-style links
function renderAnswer(text: string) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add the link
    const linkText = match[1];
    const linkUrl = match[2];
    // Add https:// if it's not already there
    const fullUrl = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    
    parts.push(
      <a
        key={match.index}
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:text-primary/80 underline transition-colors"
      >
        {linkText}
      </a>
    );
    
    lastIndex = linkRegex.lastIndex;
  }
  
  // Add remaining text after the last link
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 1 ? parts : text;
}

interface FAQItemProps {
  id: string;
  question: string;
  answer: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}

function FAQItem({ id, question, answer, isExpanded, onToggle }: FAQItemProps) {
  const handleToggle = () => {
    onToggle(id);
  };

  return (
    <Card id={id} className="mb-4 shadow-lg border-0 scroll-mt-8">
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleToggle}
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
            {renderAnswer(answer)}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function FAQPage() {
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const faqItems = [
    {
      id: 'what-is-samba',
      question: 'What is Samba?',
      answer: 'Samba is a cross-border payment platform that enables seamless money transfers between different payment providers like Venmo and Revolut. Samba uses zkTLS through ZKP2P to ensure secure, fast, and cost-effective transactions without the need for traditional banking intermediaries. '
    },
    {
      id: 'who-am-i-paying',
      question: 'How do payments work?',
      answer: 'Samba works by connecting supply/ demand for different currencies & platforms via ZKP2P. When you want to send money from Venmo to someone on Revolut, you\'ll send money on Venmo to a market maker first, and a market maker will send the equivalent amount on Revolut to the recipient.\n\nIt can be confusing when you enter in your recipient and see "send money to X" (a different recipient)! This is part of the magic of Samba routing your payments across applications and is totally secure.'
    },
    {
      id: 'supported-platforms',
      question: 'Which payment platforms are supported?',
      answer: 'Currently, Samba supports transfers between:\n\n• Venmo (USD)\n• Revolut (USD, with EUR and GBP coming soon)\n\nWe will eventually expand to include all currencies and platforms included in ZKP2P and add connectors to ZKP2P where new service routes for Samba are demanded.'
    },
    {
      id: 'fees-and-rates',
      question: 'What are the fees and exchange rates?',
      answer: 'Samba offers competitive fees and transparent pricing:\n\n• Transaction fees are determined by the market makers of each platform - typically 0.5% to 1%. Right now, Samba does not take an additional fee on top, and is working to drive market making fees as close to 0 as possible.\n'
    },
    {
      id: 'security',
      question: 'How secure are fund transfers on Samba?',
      answer: 'Samba offers superior security to traditional cross-border payments. Due to the underlying blockchain infrastructure, if a transaction somehow cannot be completed, your money is owned by you and can always be reclaimed. **In the alpha MVP, this feature is not enabled, and we will manually drive the refund process if you are not interested in writing scripts to refund yourself.'
    },
    {
      id: 'transaction-limits',
      question: 'Are there any transaction limits?',
      answer: 'In the alpha MVP, Samba has a restrictive limit of $100 per transaction. This is to limit our liability in case of any issues (as we will of course refund you if there are any issues).'
    },
    {
      id: 'processing-time',
      question: 'How long do transfers take?',
      answer: 'Most Samba transfers are completed quickly:\n\n• Payment verification: ~1 Minute\n• Offramp market making: 5-10 minutes\n• Recipient notification: Immediate\n• Total processing time: Typically 5-10 minutes\n\nProcessing times may vary depending on network congestion and payment platform response times. We will work to make market making as instant as possible in the future.'
    },
    {
      id: 'getting-started',
      question: 'How do I get started?',
      answer: 'Getting started with Samba is simple:\n\n1. Sign in with your Google account\n2. Connect your payment accounts (Venmo, Revolut, etc.)\n3. Enter transfer details and recipient information\n4. Review and confirm the transaction\n5. Complete the payment through your chosen platform\n\nThe entire process is guided and user-friendly, with support available if you need help.'
    },
    {
      id: 'why-google',
      question: 'Why do I need to sign in with Google?',
      answer: 'Samba\'s MVP is built to showcase a vision of an end product that does not target crypto-native customers. We will eventually implement full account abstraction, but in the meantime we simulate account actions by driving auth and processing on the backend.'
    },
    {
      id: 'support',
      question: 'How can I get help or support?',
      answer: 'Join the [Samba Telegram Support Group here!](t.me/attestedfrontier/2)'
    }
  ];

  const handleToggle = (id: string) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(id)) {
      newExpandedItems.delete(id);
      // Remove hash from URL when collapsing
      router.push('/faq', { scroll: false });
    } else {
      newExpandedItems.add(id);
      // Add hash to URL when expanding
      router.push(`/faq#${id}`, { scroll: false });
      // Scroll to the element
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    setExpandedItems(newExpandedItems);
  };

  // Handle initial load with hash
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash && faqItems.find(item => item.id === hash)) {
      setExpandedItems(new Set([hash]));
      // Scroll to the element after a brief delay to ensure rendering
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

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
              isExpanded={expandedItems.has(item.id)}
              onToggle={handleToggle}
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
                  onClick={() => window.open('https://t.me/attestedfrontier/2', '_blank')}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80"
                >
                  Join Telegram Support
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