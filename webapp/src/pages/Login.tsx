import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { RefreshCw, ArrowLeft, Loader2, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { sendOTP, verifyOTP, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await sendOTP(email);

      if (result.error) {
        setError(result.error);
      } else {
        setStep(2);
      }
    } catch {
      setError("Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await verifyOTP(email, otp);

      if (result.error) {
        setError(result.error);
      } else {
        navigate("/app");
      }
    } catch {
      setError("Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setOtp("");
    setError("");
  };

  const loading = isLoading || authLoading;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.1), transparent)`
          }}
        />
      </div>

      {/* Back button */}
      <div className="relative z-10 p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => step === 2 ? handleBack() : navigate("/")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center glow-primary mb-4">
              <RefreshCw className="w-6 h-6 text-primary" />
            </div>
            <h1 className="font-syne text-2xl font-bold text-foreground">
              {step === 1 ? "Welcome back" : "Enter verification code"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1 text-center">
              {step === 1
                ? "Enter your email to receive a code"
                : `We sent a code to ${email}`
              }
            </p>
          </div>

          {/* Step 1: Email input */}
          {step === 1 ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-card border-border focus:border-primary"
                />
              </div>

              {error && (
                <p className="text-destructive text-sm">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Code
                  </>
                )}
              </Button>
            </form>
          ) : (
            /* Step 2: OTP input */
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <Label className="text-foreground">Verification Code</Label>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                  disabled={loading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="bg-card border-border" />
                    <InputOTPSlot index={1} className="bg-card border-border" />
                    <InputOTPSlot index={2} className="bg-card border-border" />
                    <InputOTPSlot index={3} className="bg-card border-border" />
                    <InputOTPSlot index={4} className="bg-card border-border" />
                    <InputOTPSlot index={5} className="bg-card border-border" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>

              <button
                type="button"
                onClick={handleSendCode}
                disabled={loading}
                className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Didn&apos;t receive a code? Resend
              </button>
            </form>
          )}

          {/* Sign up link - only show on step 1 */}
          {step === 1 && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
