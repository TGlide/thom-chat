import { Context, type Getter, type Setter } from 'runed';

class PromptState {
	constructor(
		readonly getPrompt: Getter<string>,
		readonly setPrompt: Setter<string>
	) {}

	get current() {
		return this.getPrompt();
	}

	set current(prompt: string) {
		this.setPrompt(prompt);
	}
}

export const ctx = new Context<PromptState>('prompt-context');

export function usePrompt(getPrompt?: Getter<string>, setPrompt?: Setter<string>) {
	try {
		return ctx.get();
	} catch {
		if (!getPrompt || !setPrompt) {
			throw new Error('Prompt context not initialized. You must provide getPrompt and setPrompt!');
		}

		return ctx.set(new PromptState(getPrompt, setPrompt));
	}
}
