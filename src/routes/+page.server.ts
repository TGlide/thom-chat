import { redirect } from "@sveltejs/kit";

export async function load() {
	// temporary redirect to /chat
	redirect(303, '/chat'); 
}