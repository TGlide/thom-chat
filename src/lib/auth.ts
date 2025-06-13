import { betterAuth } from 'better-auth';
import { convexAdapter } from '@better-auth-kit/convex';
import { ConvexHttpClient } from 'convex/browser';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private';

const convexClient = new ConvexHttpClient(process.env.CONVEX_SITE_URL!);

export const auth = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET!,
	database: convexAdapter(convexClient),
	socialProviders: {
		github: {
			clientId: GITHUB_CLIENT_ID,
			clientSecret: GITHUB_CLIENT_SECRET
		}
	},
	plugins: []
});
