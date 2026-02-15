import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session after OAuth redirect
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(true);
          setTimeout(() => navigate('/auth'), 2000);
          return;
        }

        if (session) {
          // Session exists, user is authenticated
          console.log('Authentication successful');
          navigate('/', { replace: true });
        } else {
          // No session found
          console.log('No session found');
          setError(true);
          setTimeout(() => navigate('/auth'), 2000);
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(true);
        setTimeout(() => navigate('/auth'), 2000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Failed
              </h2>
              <p className="text-gray-600">Redirecting to login...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Loader2 className="w-16 h-16 mx-auto text-green-600 animate-spin" />
              <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full border-4 border-green-200 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Completing sign in...
              </h2>
              <p className="text-gray-600">Please wait a moment</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
