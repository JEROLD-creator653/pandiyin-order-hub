import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithPhone, signUpWithPhone, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMethod === 'email') {
        if (isSignUp) {
          const { error } = await signUp(email, password, fullName);
          if (error) throw error;
          toast({ title: 'Account created!', description: 'Please check your email to verify your account.' });
        } else {
          const { error } = await signIn(email, password);
          if (error) throw error;
          toast({ title: 'Welcome back!' });
          navigate('/');
        }
      } else {
        // Phone authentication
        const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
        
        if (isSignUp) {
          const { error } = await signUpWithPhone(formattedPhone, fullName);
          if (error) throw error;
        } else {
          const { error } = await signInWithPhone(formattedPhone);
          if (error) throw error;
        }
        
        setShowOtpInput(true);
        toast({ 
          title: 'OTP Sent!', 
          description: 'Please check your phone for the verification code.' 
        });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const { error } = await verifyOtp(formattedPhone, otp);
      if (error) throw error;
      
      toast({ title: 'Success!', description: 'You have been logged in.' });
      navigate('/');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Invalid OTP. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const { error } = await resendOtp(formattedPhone);
      if (error) throw error;
      
      toast({ title: 'OTP Resent!', description: 'Please check your phone for the new verification code.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Leaf className="h-10 w-10 mx-auto text-primary mb-2" />
            <CardTitle className="text-2xl font-display">{isSignUp ? 'Create Account' : 'Welcome Back'}</CardTitle>
            <CardDescription>{isSignUp ? 'Join PANDIYIN for fresh homemade goodness' : 'Sign in to your account'}</CardDescription>
          </CardHeader>
          <CardContent>
            {!showOtpInput ? (
              <>
                <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as 'email' | 'phone')} className="w-full mb-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email" className="gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </TabsTrigger>
                    <TabsTrigger value="phone" className="gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        value={fullName} 
                        onChange={e => setFullName(e.target.value)} 
                        placeholder="Enter your full name"
                        required 
                      />
                    </div>
                  )}
                  
                  {authMethod === 'email' ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={email} 
                          onChange={e => setEmail(e.target.value)} 
                          placeholder="your@email.com"
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input 
                          id="password" 
                          type="password" 
                          value={password} 
                          onChange={e => setPassword(e.target.value)} 
                          placeholder="Enter password"
                          required 
                          minLength={6} 
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="flex gap-2">
                        <div className="flex items-center px-3 border rounded-md bg-muted">
                          <span className="text-sm">+91</span>
                        </div>
                        <Input 
                          id="phone" 
                          type="tel" 
                          value={phone} 
                          onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} 
                          placeholder="9876543210"
                          maxLength={10}
                          pattern="[0-9]{10}"
                          required 
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">You will receive an OTP for verification</p>
                    </div>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
                  </Button>
                </form>
              </>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input 
                    id="otp" 
                    type="text" 
                    value={otp} 
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} 
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required 
                    className="text-center text-2xl tracking-widest"
                    autoFocus
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    OTP sent to +91{phone}
                  </p>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full" 
                  onClick={handleResendOtp}
                  disabled={loading}
                >
                  Resend OTP
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    setShowOtpInput(false);
                    setOtp('');
                  }}
                >
                  Back
                </Button>
              </form>
            )}
            
            <p className="text-center text-sm mt-4 text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setShowOtpInput(false);
                  setOtp('');
                }} 
                className="text-primary font-medium hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
