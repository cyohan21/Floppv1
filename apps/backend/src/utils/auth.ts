import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username, emailOTP } from "better-auth/plugins"
import {hashPassword, comparePassword} from "./bcrypt"
import { openAPI } from "better-auth/plugins"
import prisma from "../lib/prisma"
import { sendEmail } from "./emailVerification";
import { APIError } from "better-auth/api";
import { createDefaultCategoriesForUser } from "../lib/seed";

export const auth = betterAuth({
    baseURL: process.env.BACKEND_URL || "http://localhost:3030",
    database: prismaAdapter(prisma, {
        provider: "postgresql"
    }),
    rateLimit: {
        enabled: true, // enabled in dev as well
        window: 15 * 60,  // in seconds, not ms.
        max: 100
    },
    user: {
        deleteUser: {
            enabled: true,
        },
        changeEmail: {
            enabled: true,
            sendChangeEmailVerification: async ({ user, token,}) => {
                await sendEmail({
                    to: user.email,
                    subject: 'Approve email change',
                    text: `Hey ${user.name.split(' ')[0] || 'there'}, 
                    Click the link to approve the change: ${process.env.BACKEND_URL}/api/auth/verify-email?token=${token}&callbackURL=${process.env.CUSTOM_URL_SCHEME}login
                    
                    If you did not request this change, please ignore this email.`
                })
            }
        }
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user, ctx) => {
                    if (!user.name || user.name.trim().split(/\s+/).length < 2) {
                        throw new APIError("BAD_REQUEST", {
                            message: "Please enter your full name (first and last).",
                            });
                        }
                        return
                },
                after: async (user, ctx) => {
                    // Update the user with firstName and lastName after creation
                    const nameParts = user.name.trim().split(/\s+/);
                    const firstName = nameParts[0];
                    const lastName = nameParts.slice(1).join(" ");
                    
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            firstName,
                            lastName,
                        }
                    });

                    await createDefaultCategoriesForUser(user.id)
                }
            }
        }
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        minPasswordLength: 8,
        password: {
            hash: hashPassword,
            verify: ({ password, hash }) => comparePassword(password, hash)
        },
        sendResetPassword: async({ user, token }, request) => {
            await sendEmail({
                to: user.email,
                subject: `Reset Your Password`,
                text: `Hey ${user.name.split(' ')[0] || 'there'}, 
                
follow this link to reset your password: 
${process.env.FRONTEND_URL}/reset-password?token=${token}

Please note that the link will expire in an hour.`
            })
        }
    },
    plugins: [
        username({
            minUsernameLength: 5,
            maxUsernameLength: 25
        }),
        openAPI(),
        emailOTP({
            sendVerificationOnSignUp: true,
            async sendVerificationOTP({ email, otp, type }: { email: string; otp: string; type: string }) {
                if (type === "sign-in") {
                    await sendEmail({
                        to: email,
                        subject: "Sign In: One-time passcode",
                        text: `Here is your one time passcode: ${otp}`
                    });
                } else if (type === "email-verification") {
                    await sendEmail({
                        to: email,
                        subject: "Verify your email address: One-Time Passcode",
                        text: `Here is your one time passcode: ${otp}`
                    });
                } else {
                    await sendEmail({
                        to: email,
                        subject: "Password Reset: One-Time Passcode",
                        text: `Here is your one time passcode: ${otp}`
                    });
                }
            },
        })
    ], // Email verification logic, might use at a later date. currently using OTP.

    // emailVerification: {
    //     sendVerificationEmail: async ( { user, token }) => {
    //         if (user.emailVerified) {
    //             throw new APIError("CONFLICT", {
    //                 message: "Email is already verified.",
    //             })
    //         }
    //     await sendEmail({
    //     to: user.email,
    //     subject: "Verify your email address",
    //     text: `Click the link to verify your email: 
    //     ${process.env.BACKEND_URL}/api/auth/verify-email?token=${token}&callbackURL=${process.env.FRONTEND_URL}/login`,
    //     // URL is only for development, please change in production.
    //   });
    // },
    // },
    socialProviders: {
        facebook: { 
            clientId: process.env.FACEBOOK_CLIENT_ID as string, 
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string, 
            fields: ["user_Friends"]
        }, 
    // Add appleid.apple.com to trustedOrigins for Sign In with Apple flows
        google: {
            prompt: "select_account",
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
            trustedOrigins: [process.env.BACKEND_URL || "http://localhost:3030", process.env.FRONTEND_URL || "http://localhost:8081", process.env.CUSTOM_URL_SCHEME || "myapp://"]
});




