import { betterAuth } from 'better-auth';
import { convexAdapter } from '@better-auth-kit/convex';
import { ConvexHttpClient } from 'convex/browser';
import 'dotenv/config';

const convexClient = new ConvexHttpClient(process.env.PUBLIC_CONVEX_URL!);

export const auth = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET!,
	database: convexAdapter(convexClient),
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID!,
			clientSecret: process.env.GITHUB_CLIENT_SECRET!,
		},
	},
	plugins: [],
});
