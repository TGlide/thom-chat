import { betterAuth } from 'better-auth';
import { convexAdapter } from '@better-auth-kit/convex';
import { ConvexHttpClient } from 'convex/browser';
import 'dotenv/config';
import { api } from './backend/convex/_generated/api';

const client = new ConvexHttpClient(process.env.PUBLIC_CONVEX_URL!);

export const auth = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET!,
	database: convexAdapter(client),
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		},
		github: {
			clientId: process.env.GITHUB_CLIENT_ID!,
			clientSecret: process.env.GITHUB_CLIENT_SECRET!,
		},
	},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					// create user settings
					await client.mutation(api.user_settings.create, {
						user_id: user.id,
					});
				},
			},
		},
	},
	plugins: [],
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60, // Cache duration in seconds
		},
	},
});
