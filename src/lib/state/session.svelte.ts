import { page } from '$app/state';
import type { Session, User } from 'better-auth';

export const session = {
	get current() {
		return page.data.session as { session: Session; user: User } | null;
	},
};
