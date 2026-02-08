import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { Resend } from "resend";
import { prisma } from "./prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        console.log(`[Auth] Sending OTP to ${email}`);
        try {
          const result = await resend.emails.send({
            from: "Loopyter <onboarding@resend.dev>",
            to: email,
            subject: "Your Loopyter Login Code",
            html: `
              <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #22d3ee; margin-bottom: 20px;">Loopyter</h2>
                <p style="color: #333; font-size: 16px;">Your verification code is:</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0d1117;">${otp}</span>
                </div>
                <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
              </div>
            `,
          });
          console.log(`[Auth] Resend response:`, JSON.stringify(result));
        } catch (err) {
          console.error(`[Auth] Resend error:`, err);
          throw err;
        }
      },
    }),
  ],
  trustedOrigins: [
    "http://localhost:*",
    "http://127.0.0.1:*",
    "https://*.dev.vibecode.run",
    "https://*.vibecode.run",
    "https://*.vibecodeapp.com",
  ],
});
