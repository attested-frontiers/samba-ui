'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, Shield, Zap, Globe, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const {
    user,
    loading,
    error,
    signIn,
    clearError,
    isCheckingContract,
    isDeployingContract,
  } = useAuth();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <img src='/samba-logo.png' alt='Samba' className='w-16 h-16 mx-auto mb-4' />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated and not checking/deploying contract, redirect to swap
  if (user && !isCheckingContract && !isDeployingContract) {
    router.push('/swap');
    return null;
  }

  // Show loading state when checking or deploying contracts
  if (user && (isCheckingContract || isDeployingContract)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <img src='/samba-logo.png' alt='Samba' className='w-16 h-16 mx-auto mb-4' />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isDeployingContract ? 'Deploying contract...' : 'Checking for wrapper contract...'}
          </p>
        </div>
      </div>
    );
  }

  const handleSignIn = async () => {
    clearError(); // Clear any previous errors
    await signIn();
  };

  const handleEnterApp = () => {
    router.push('/swap');
  };

  console.log('isDeployingContract', isDeployingContract);

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5'>
      {/* Header */}
      <header className='container mx-auto px-4 py-6'>
        <nav className='flex items-center justify-between'>
          <div className='flex items-center space-x-1'>
            <img src='/samba-logo.png' alt='Samba' className='w-12 h-12' />
            <span className='text-xl font-bold text-gray-900'>Samba</span>
          </div>
          <Button
            onClick={user ? handleEnterApp : handleSignIn}
            disabled={loading || isCheckingContract || isDeployingContract}
            className='bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80'
          >
            {isDeployingContract
              ? 'Deploying contract...'
              : isCheckingContract
              ? 'Checking for wrapper contract...'
              : loading
              ? 'Signing in...'
              : user
              ? 'Enter App'
              : 'Sign In'}
          </Button>
        </nav>
      </header>

      {/* Error Display */}
      {error && (
        <div className='container mx-auto px-4 pt-4'>
          <div className='max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex items-center space-x-2'>
              <div className='h-4 w-4 bg-red-600 rounded-full flex items-center justify-center text-white text-xs'>
                !
              </div>
              <span className='text-red-800 font-medium text-sm'>
                Sign In Error
              </span>
            </div>
            <p className='text-red-700 text-sm mt-1'>{error}</p>
            <button
              onClick={clearError}
              className='text-red-600 hover:text-red-800 text-xs underline mt-2'
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className='container mx-auto px-4 py-20'>
        <div className='text-center max-w-4xl mx-auto'>
          <h1 className='text-5xl md:text-6xl font-bold text-gray-900 mb-6'>
            Seamless Cross-Border
            <span className='bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent'>
              {' '}
              Payments
            </span>
          </h1>
          <p className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto'>
            Exchange money instantly between different payment providers. Fast,
            secure, and transparent cross-border transactions with minimal fees.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button
              onClick={user ? handleEnterApp : handleSignIn}
              disabled={loading || isCheckingContract || isDeployingContract}
              size='lg'
              className='bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-lg px-8 py-3'
            >
              {isDeployingContract ? (
                'Deploying contract...'
              ) : isCheckingContract ? (
                'Checking contract...'
              ) : loading ? (
                'Signing in...'
              ) : user ? (
                <>
                  Enter App <ArrowRight className='ml-2 h-5 w-5' />
                </>
              ) : (
                <>
                  Get Started <ArrowRight className='ml-2 h-5 w-5' />
                </>
              )}
            </Button>
            <Link href='/faq'>
              <Button variant='outline' size='lg' className='text-lg px-8 py-3'>
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='container mx-auto px-4 py-20'>
        <div className='text-center mb-16'>
          <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
            Why Choose Samba?
          </h2>
          <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
            Built for the modern world, connecting payment providers seamlessly
          </p>
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
          <Card className='text-center border-0 shadow-lg hover:shadow-xl transition-shadow'>
            <CardHeader>
              <div className='w-12 h-12 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center mx-auto mb-4'>
                <Shield className='h-6 w-6 text-primary' />
              </div>
              <CardTitle className='text-xl'>Secure & Trusted</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className='text-base'>
                Your cash and data are protected with advanced security measures
              </CardDescription>
            </CardContent>
          </Card>

          <Card className='text-center border-0 shadow-lg hover:shadow-xl transition-shadow'>
            <CardHeader>
              <div className='w-12 h-12 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center mx-auto mb-4'>
                <Zap className='h-6 w-6 text-primary' />
              </div>
              <CardTitle className='text-xl'>Lightning Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className='text-base'>
                Send money across borders in seconds
              </CardDescription>
            </CardContent>
          </Card>

          <Card className='text-center border-0 shadow-lg hover:shadow-xl transition-shadow'>
            <CardHeader>
              <div className='w-12 h-12 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center mx-auto mb-4'>
                <Globe className='h-6 w-6 text-primary' />
              </div>
              <CardTitle className='text-xl'>Global Reach</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className='text-base'>
                Connect dozens of payment providers from different countries
                easily
              </CardDescription>
            </CardContent>
          </Card>

          <Card className='text-center border-0 shadow-lg hover:shadow-xl transition-shadow'>
            <CardHeader>
              <div className='w-12 h-12 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center mx-auto mb-4'>
                <TrendingUp className='h-6 w-6 text-primary' />
              </div>
              <CardTitle className='text-xl'>Minimal Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className='text-base'>
                Low, transparent fees with no hidden costs
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className='container mx-auto px-4 py-20'>
        <Card className='bg-gradient-to-r from-primary to-secondary border-0 text-white'>
          <CardContent className='text-center py-16'>
            <h2 className='text-3xl md:text-4xl font-bold mb-4'>
              Ready to Start Swapping?
            </h2>
            <p className='text-xl mb-8 opacity-90 max-w-2xl mx-auto'>
              Join thousands of users who trust Samba for their currency
              exchange needs. Sign in with Google and start trading in minutes.
            </p>
            <Button
              onClick={user ? handleEnterApp : handleSignIn}
              disabled={loading || isCheckingContract || isDeployingContract}
              size='lg'
              variant='secondary'
              className='text-lg px-8 py-3 bg-white text-primary hover:bg-gray-100'
            >
              {isDeployingContract ? (
                'Deploying contract...'
              ) : isCheckingContract ? (
                'Checking contract...'
              ) : loading ? (
                'Signing in...'
              ) : user ? (
                <>
                  Enter App <ArrowRight className='ml-2 h-5 w-5' />
                </>
              ) : (
                <>
                  Sign in with Google <ArrowRight className='ml-2 h-5 w-5' />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className='container mx-auto px-4 py-12 border-t'>
        <div className='text-center text-gray-600'>
          <p>&copy; 2024 Samba. All rights reserved.</p>
          <div className='flex justify-center space-x-6 mt-4'>
            <Link href='/faq' className='hover:text-primary transition-colors'>
              FAQ
            </Link>
            <Link href='/privacy' className='hover:text-primary transition-colors'>
              Privacy Policy
            </Link>
            <Link href='/terms' className='hover:text-primary transition-colors'>
              Terms of Service
            </Link>
            <Link href='https://t.me/attestedfrontier/2' target='_blank' className='hover:text-primary transition-colors'>
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
