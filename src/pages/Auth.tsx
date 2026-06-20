import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSignIn, useSignUp } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getDeterministicUUID } from "@/components/AuthProvider";

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const isSignUp = mode === "signup";
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // Input fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Sign up verification states
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  // Password reset states
  const [pendingPasswordReset, setPendingPasswordReset] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Sign in MFA / Client Trust states
  const [pendingSecondFactor, setPendingSecondFactor] = useState(false);
  const [secondFactorCode, setSecondFactorCode] = useState("");
  const [secondFactorStrategy, setSecondFactorStrategy] = useState<string | null>(null);

  const navigate = useNavigate();
  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();

  // Helper to sync profile after successful sign up
  const createProfileRecord = async (userId: string, name: string) => {
    try {
      await supabase.from("profiles").upsert({
        id: getDeterministicUUID(userId),
        full_name: name || email.split("@")[0],
      });
    } catch (err) {
      console.error("Error creating Supabase profile:", err);
    }
  };

  // Login handler
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoaded) return;
    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });
      if (result.status === "complete") {
        await setSignInActive({ session: result.createdSessionId });
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        navigate("/profile");
      } else if (result.status === "needs_second_factor" || result.status === "needs_client_trust") {
        const factor = result.supportedSecondFactors?.find(
          (f) => f.strategy === "totp" || f.strategy === "email_code" || f.strategy === "phone_code" || f.strategy === "backup_code"
        );
        if (factor) {
          if (factor.strategy === "email_code" || factor.strategy === "phone_code") {
            await signIn.prepareSecondFactor({ strategy: factor.strategy });
          }
          setSecondFactorStrategy(factor.strategy);
          setPendingSecondFactor(true);
          toast({
            title: "Verification required",
            description: factor.strategy === "email_code" || factor.strategy === "phone_code"
              ? `A verification code has been sent to your ${factor.strategy === "email_code" ? "email" : "phone"}.`
              : `Please enter your ${factor.strategy === "totp" ? "authenticator app code" : "backup code"}.`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Verification required",
            description: "No supported verification method found. Please contact support.",
          });
        }
      } else {
        console.warn("Sign in status not complete:", result.status);
        toast({
          variant: "destructive",
          title: "Login failed",
          description: `Login status is incomplete: ${result.status}`,
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  // Second factor verification handler
  const handleSecondFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoaded || !secondFactorStrategy) return;
    setLoading(true);
    try {
      const result = await signIn.attemptSecondFactor({
        strategy: secondFactorStrategy as any,
        code: secondFactorCode,
      });
      if (result.status === "complete") {
        await setSignInActive({ session: result.createdSessionId });
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        navigate("/profile");
      } else {
        toast({
          variant: "destructive",
          title: "Verification failed",
          description: `Unexpected sign-in status: ${result.status}`,
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  // Sign up handler
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpLoaded) return;
    setLoading(true);
    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        unsafeMetadata: {
          full_name: fullName,
        }
      });

      if (result.status === "complete") {
        await setSignUpActive({ session: result.createdSessionId });
        await createProfileRecord(result.createdUserId || signUp.createdUserId || "", fullName);
        toast({
          title: "Welcome!",
          description: "Your account has been created successfully.",
        });
        navigate("/profile");
      } else {
        // Send verification code email
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setPendingVerification(true);
        toast({
          title: "Verification code sent",
          description: "Please check your email for a verification code.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error signing up",
        description: err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  // Email verification handler
  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpLoaded) return;
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });
      if (result.status === "complete") {
        await setSignUpActive({ session: result.createdSessionId });
        await createProfileRecord(result.createdUserId || signUp.createdUserId || "", fullName);
        toast({
          title: "Welcome!",
          description: "Your account has been verified and created successfully.",
        });
        navigate("/profile");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password request handler
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoaded) return;
    setLoading(true);
    try {
      const result = await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      if (result.status === "needs_first_factor") {
        setPendingPasswordReset(true);
        toast({
          title: "Code sent",
          description: "Check your email for the password reset code.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error requesting reset",
        description: err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset Password submit handler
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoaded) return;
    if (newPassword !== confirmNewPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please check your passwords.",
      });
      return;
    }
    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode,
        password: newPassword,
      });
      if (result.status === "complete") {
        await setSignInActive({ session: result.createdSessionId });
        toast({
          title: "Password reset success!",
          description: "Your password has been reset and you are signed in.",
        });
        navigate("/profile");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset fields on mode change
  useEffect(() => {
    setPassword("");
    setFullName("");
    setShowPassword(false);
    setPendingSecondFactor(false);
    setSecondFactorCode("");
    setSecondFactorStrategy(null);
  }, [mode]);

  // Reset all states when switching forms
  const toggleForm = (isRegister: boolean) => {
    setSearchParams({ mode: isRegister ? "signup" : "signin" });
    setIsForgotPassword(false);
    setPendingVerification(false);
    setPendingPasswordReset(false);
    setPendingSecondFactor(false);
    setSecondFactorCode("");
    setSecondFactorStrategy(null);
    setEmail("");
    setPassword("");
    setFullName("");
    setShowPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  };

  // Sign In Second Factor / Device Verification Screen
  if (pendingSecondFactor) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6">
        <Card className="w-full max-w-md bg-white/50 backdrop-blur-sm border border-slate-200/80 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl sm:text-2xl text-slate-950 font-bold">Verify Your Identity</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {secondFactorStrategy === "email_code" 
                ? "We sent a verification code to your email. Please enter it below to confirm your device."
                : secondFactorStrategy === "phone_code"
                  ? "We sent a verification code to your phone. Please enter it below to confirm your device."
                  : secondFactorStrategy === "totp"
                    ? "Please enter the code from your authenticator app to complete sign in."
                    : "Please enter your backup code to complete sign in."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSecondFactorSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="secondFactorCode">Verification Code</Label>
                <Input
                  id="secondFactorCode"
                  type="text"
                  value={secondFactorCode}
                  onChange={(e) => setSecondFactorCode(e.target.value)}
                  required
                  className="bg-white"
                  placeholder={secondFactorStrategy === "backup_code" ? "Enter backup code" : "Enter 6-digit code"}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gray-500 hover:bg-gray-400 text-white font-normal">
                {loading ? "Verifying..." : "Verify Code"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => toggleForm(false)}
                  className="text-xs sm:text-sm text-blue-600 hover:underline mt-2"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 1. Sign Up Email Verification Screen
  if (pendingVerification) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6">
        <Card className="w-full max-w-md bg-white/50 backdrop-blur-sm border border-slate-200/80 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl sm:text-2xl text-slate-950 font-bold">Verify Email</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Enter the verification code sent to your email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  className="bg-white"
                  placeholder="123456"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gray-500 hover:bg-gray-400 text-white font-normal">
                {loading ? "Verifying..." : "Verify Code"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. Forgot Password - Verification & Password Reset Screen
  if (isForgotPassword && pendingPasswordReset) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6">
        <Card className="w-full max-w-md bg-white/50 backdrop-blur-sm border border-slate-200/80 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl sm:text-2xl text-slate-950 font-bold">New Password</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Enter the reset code sent to your email and your new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetCode">Verification Code</Label>
                <Input
                  id="resetCode"
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  required
                  className="bg-white"
                  placeholder="Code from email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="bg-white pr-10"
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmNewPassword"
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    className="bg-white pr-10"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gray-500 hover:bg-gray-400 text-white font-normal">
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. Main Login / Register / Forgot Password Forms
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
              ? "Enter your email to receive a password reset code"
              : isSignUp
                ? "Sign up to start managing your tasks"
                : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form 
            onSubmit={
              isForgotPassword 
                ? handleForgotPasswordSubmit 
                : isSignUp 
                  ? handleSignUpSubmit 
                  : handleSignInSubmit
            } 
            className="space-y-4"
          >
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
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white text-sm sm:text-base pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            
            <Button type="submit" disabled={loading} className="w-full bg-gray-500 hover:bg-gray-400 text-white text-sm sm:text-base font-normal">
              {loading 
                ? "Processing..." 
                : isForgotPassword 
                  ? "Send Reset Code" 
                  : isSignUp 
                    ? "Sign Up" 
                    : "Sign In"}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            {isForgotPassword ? (
              <button
                onClick={() => toggleForm(false)}
                className="text-xs sm:text-sm text-blue-600 hover:underline"
              >
                Back to Sign In
              </button>
            ) : (
              <button
                onClick={() => toggleForm(!isSignUp)}
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
