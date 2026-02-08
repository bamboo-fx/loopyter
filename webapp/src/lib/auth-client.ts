import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

const baseURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL,
  plugins: [emailOTPClient()],
});

export const {
  signOut,
  useSession,
  getSession,
} = authClient;
