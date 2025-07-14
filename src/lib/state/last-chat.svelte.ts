import { Context } from 'runed';

class LastChatState {
	constructor(readonly opts: { lastChat: string | null }) {
	}
    
    get current() {
        return this.opts.lastChat;
    }

    set current(chat: string | null) {
        this.opts.lastChat = chat;
    }
}

const ctx = new Context<LastChatState>('last-chat');

export function setupLastChat() {
	return ctx.set(new LastChatState({ lastChat: null }));
}

export function useLastChat() {
	return ctx.get();
}