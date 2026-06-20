
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const { signIn, signUp, sendPasswordResetEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isForgotPassword) {
      await sendPasswordResetEmail(email);
    } else if (isSignUp) {
      await signUp(email, password, fullName);
    } else {
      await signIn(email, password);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6">
      <Card className="w-full max-w-md bg-white/50 backdrop-blur-sm border border-slate-200/80 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl sm:text-2xl text-slate-950 font-bold">
            {isForgotPassword 
              ? "Reset Password" 
              : isSignUp 
                ? "Create Account" 
                : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {isForgotPassword
              ? "Enter your email to receive a password recovery link"
              : isSignUp
                ? "Sign up to start managing your tasks"
                : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isForgotPassword && isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm sm:text-base">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-white text-sm sm:text-base"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white text-sm sm:text-base"
              />
            </div>
            {!isForgotPassword && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white text-sm sm:text-base"
                />
              </div>
            )}
            <Button type="submit" className="w-full bg-gray-500 hover:bg-gray-400 text-white text-sm sm:text-base font-normal">
              {isForgotPassword 
                ? "Send Reset Link" 
                : isSignUp 
                  ? "Sign Up" 
                  : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            {isForgotPassword ? (
              <button
                onClick={() => setIsForgotPassword(false)}
                className="text-xs sm:text-sm text-blue-600 hover:underline"
              >
                Back to Sign In
              </button>
            ) : (
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs sm:text-sm text-blue-600 hover:underline"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
