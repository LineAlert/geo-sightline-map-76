import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';


const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setError('This email is already registered. Please try signing in instead.');
        } else {
          setError(error.message);
        }
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your signup.",
        });
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else {
          setError(error.message);
        }
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        navigate('/');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="https://lh3.googleusercontent.com/pw/AP1GczO0Y11QZGDAP3QFJ8BqXkEv425jsX9Jfr2jiDPH4p-okKN_-0d8BuzWPu06U4hEjwlbsyG8a19KWeZNqogIkzyVlyxmA-CLLTc33ViB4j4pNQI_o0AGQQG1lAgtJzp30C5R8W3-ZZbgZldXaurEIL34jVnd19-H8g654BoVdjpQiWfNVp_CEZ4mXjdktOV_a1ImTPEWTRB7vuuyQJp8crVwWT7SXNTRIMxtzSLLpMQXfL6sUDlSdbwZ_HKbboru0EsIf7Jd4CkwngEhzJZntRUgJ2uIZX8Xq2wvxNLJjUjBuwLeteXSfgsFlkULIbpxthi0NDWFbyBqsRHCB-Rzqj1Ps3CpB96Uu1KKBAXIUS8GohTXbfywl4FCOqlPrLoNlhYNUDrtF8lU4HIfLFyvEBoh1LFR-UZXH9dYQoUjr9CYM4O1qlWGDSDLcdMpeOY0MUjTEi9bQirV7funN-lYx-5eGazAi0KSmAU3fJnre0FSrR_sYXPEdtvhF8VE8_smLC2PmNT-2DlaqXuNTbdwF01IMBCGU8PI7_dYuJKM4GhuzQjLdWvUN8snE9m9feh3ZDQ9kew7LuyP9WUV34UoE9cOMjZvE96zI9zz8jwh7p9fbKH6Ewuz5e2tv8V3Ei7CDZHlMyBJ34-mkX_DQvswwbTMz_rIZJ5fRjX69jZCmFjh2fHSvCxcBqST30QDXgUR0t-jtLIR1Kl0FpwiG4v92tcW5My9jZomZ-w6tkBqA-dfvXyO09lY4IoHKHRja2jK1rdRPd_AAH6UNIpzpRdT5i6ff893tJ90GBvfDIIfQxwrO0jlY1Kbty7vESoaW285OicWgFxKFQYFnc0DlhKlggErDLauN9aC8alVhMQbl_1H_HmRFLKbmvz-Opbsvu6vTzJk=w1440-h509-s-no?authuser=0"
              alt="LineAlert Logo" 
              className="h-12 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold">Login for State and Federal Agencies</CardTitle>
          <CardDescription>
            Access the damage assessment system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Choose a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;