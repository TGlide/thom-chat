import type { Doc } from "$lib/backend/convex/_generated/dataModel";

export function parseMessageForRules(message: string, rules: Doc<'user_rules'>[]): Doc<'user_rules'>[] {
	const matchedRules: Doc<'user_rules'>[] = [];

	for (const rule of rules) {
		const match = message.match(new RegExp(`@${rule.name}(\\s|$)`));
		if (!match) continue;

		matchedRules.push(rule);
	}

	return matchedRules;
}