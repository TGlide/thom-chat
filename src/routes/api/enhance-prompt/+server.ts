import { error, json, type RequestHandler } from '@sveltejs/kit';
import { ResultAsync } from 'neverthrow';
import { z } from 'zod/v4';
import { OPENROUTER_FREE_KEY } from '$env/static/private';
import { OpenAI } from 'openai';
import { ConvexHttpClient } from 'convex/browser';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$lib/backend/convex/_generated/api';
import { parseMessageForRules } from '$lib/utils/rules';
import { Provider } from '$lib/types';

const FREE_MODEL = 'google/gemma-3-27b-it';

const reqBodySchema = z.object({
	prompt: z.string(),
});

const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);

export type EnhancePromptRequestBody = z.infer<typeof reqBodySchema>;

export type EnhancePromptResponse = {
	ok: true;
	enhanced_prompt: string;
};

function response({ enhanced_prompt }: { enhanced_prompt: string }) {
	return json({
		ok: true,
		enhanced_prompt,
	});
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const bodyResult = await ResultAsync.fromPromise(
		request.json(),
		() => 'Failed to parse request body'
	);

	if (bodyResult.isErr()) {
		return error(400, 'Failed to parse request body');
	}

	const parsed = reqBodySchema.safeParse(bodyResult.value);
	if (!parsed.success) {
		return error(400, parsed.error);
	}
	const args = parsed.data;

	const session = await locals.auth();

	if (!session) {
		return error(401, 'You must be logged in to enhance a prompt');
	}

	const [rulesResult, keyResult] = await Promise.all([
		ResultAsync.fromPromise(
			client.query(api.user_rules.all, {
				session_token: session.session.token,
			}),
			(e) => `Failed to get rules: ${e}`
		),
		ResultAsync.fromPromise(
			client.query(api.user_keys.get, {
				provider: Provider.OpenRouter,
				session_token: session.session.token,
			}),
			(e) => `Failed to get API key: ${e}`
		),
	]);

	if (rulesResult.isErr()) {
		return error(500, 'Failed to get rules');
	}

	if (keyResult.isErr()) {
		return error(500, 'Failed to get key');
	}

	const mentionedRules = parseMessageForRules(
		args.prompt,
		rulesResult.value.filter((r) => r.attach === 'manual')
	);

	const openai = new OpenAI({
		baseURL: 'https://openrouter.ai/api/v1',
		apiKey: keyResult.value ?? OPENROUTER_FREE_KEY,
	});

	const enhancePrompt = `
Enhance prompt below (wrapped in <prompt> tags) so that it can be better understood by LLMs You job is not to answer the prompt but simply prepare it to be answered by another LLM. 
You can do this by fixing spelling/grammatical errors, clarifying details, and removing unnecessary wording where possible.
Only return the enhanced prompt, nothing else. Do NOT wrap it in quotes, do NOT use markdown.
Do NOT respond to the prompt only optimize it so that another LLM can understand it better.
Do NOT remove context that may be necessary for the prompt to be understood.

${
	mentionedRules.length > 0
		? `The user has mentioned rules with the @<rule_name> syntax. Make sure to include the rules in the final prompt even if you just add them to the end.
Mentioned rules: ${mentionedRules.map((r) => `@${r.name}`).join(', ')}`
		: ''
}

<prompt>
${args.prompt}
</prompt>
`;

	const enhancedResult = await ResultAsync.fromPromise(
		openai.chat.completions.create({
			model: FREE_MODEL,
			messages: [{ role: 'user', content: enhancePrompt }],
			temperature: 0.5,
		}),
		(e) => `Enhance prompt API call failed: ${e}`
	);

	if (enhancedResult.isErr()) {
		return error(500, 'error enhancing the prompt');
	}

	const enhancedResponse = enhancedResult.value;
	const enhanced = enhancedResponse.choices[0]?.message?.content;

	if (!enhanced) {
		return error(500, 'error enhancing the prompt');
	}

	return response({
		enhanced_prompt: enhanced,
	});
};
