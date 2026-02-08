import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { authClient, useSession } from "@/lib/auth-client";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sendOTP: (email: string) => Promise<{ error?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending, refetch } = useSession();

  const handleSendOTP = useCallback(async (email: string) => {
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });

      if (result.error) {
        return { error: result.error.message || "Failed to send verification code" };
      }

      return {};
    } catch {
      return { error: "Failed to send verification code" };
    }
  }, []);

  const handleVerifyOTP = useCallback(async (email: string, otp: string) => {
    try {
      // Use signIn.emailOtp instead of verifyEmail for sign-in flow
      const result = await authClient.signIn.emailOtp({
        email,
        otp,
      });

      if (result.error) {
        return { error: result.error.message || "Invalid verification code" };
      }

      await refetch();
      return {};
    } catch {
      return { error: "Failed to verify code" };
    }
  }, [refetch]);

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    await refetch();
  }, [refetch]);

  const value: AuthContextType = {
    user: session?.user as User | null ?? null,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
    sendOTP: handleSendOTP,
    verifyOTP: handleVerifyOTP,
    signOut: handleSignOut,
    refetch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
