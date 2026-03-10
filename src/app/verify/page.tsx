'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const error = searchParams.get('error');
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    success === 'true' ? 'success' : error ? 'error' : 'loading'
  );

  useEffect(() => {
    if (success === 'true') {
      setStatus('success');
      // Auto-redirect to dashboard after 3 seconds
      const timer = setTimeout(() => router.push('/dashboard'), 3000);
      return () => clearTimeout(timer);
    }

    if (error) {
      setStatus('error');
      return;
    }

    if (token) {
      // Redirect to API endpoint which handles verification
      window.location.href = `/api/auth/verify-email?token=${token}`;
    } else {
      setStatus('error');
    }
  }, [success, error, token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm text-center">
        <div className="flex flex-col items-center mb-6">
          <Image src="/graphcooker-icon.svg" alt="GraphCooker" width={48} height={48} className="mb-3" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Verifying your email...</h2>
              <p className="text-sm text-gray-500">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-sm text-gray-500 mb-4">Your email has been verified successfully. Redirecting to dashboard...</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
              >
                Go to Dashboard
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-sm text-gray-500 mb-4">
                {error === 'invalid_token'
                  ? 'The verification link is invalid or has expired.'
                  : error === 'user_not_found'
                    ? 'User account not found.'
                    : 'Something went wrong during verification.'}
              </p>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
              >
                Go to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
