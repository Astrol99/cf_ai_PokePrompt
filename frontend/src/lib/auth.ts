import { createAuthClient } from "better-auth/react";

// In production, this should point to your Cloudflare Worker URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export const authClient = createAuthClient({
    baseURL: API_URL,
});
