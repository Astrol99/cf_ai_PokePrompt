import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";

export const initAuth = (env: { DB: D1Database, GOOGLE_CLIENT_ID?: string, GOOGLE_CLIENT_SECRET?: string, BETTER_AUTH_URL?: string }) => {
    return betterAuth({
        database: drizzleAdapter(drizzle(env.DB, { schema }), {
            provider: "sqlite",
            schema: { 
                 ...schema 
            }
        }),
        baseURL: env.BETTER_AUTH_URL, 
        advanced: {
            defaultCookieAttributes: {
                sameSite: "none",
                secure: true
            }
        },
        socialProviders: {
            google: {
                clientId: env.GOOGLE_CLIENT_ID || "",
                clientSecret: env.GOOGLE_CLIENT_SECRET || "",
            },
        },
        trustedOrigins: ["http://localhost:5173", "https://pokeprompt.pages.dev"],
    });
};
