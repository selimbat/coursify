import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { verifyToken, AUTH_COOKIE_NAME } from '$lib/services/auth.service';

const PUBLIC_ROUTES = ['/login'];

export const handle: Handle = async ({ event, resolve }) => {
    const { pathname } = event.url;

    // Allow public routes through without auth check
    if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
        return resolve(event);
    }

    // Verify JWT from cookie
    const token = event.cookies.get(AUTH_COOKIE_NAME);
    const authenticated = token ? await verifyToken(token) : false;

    if (!authenticated) {
        redirect(303, '/login');
    }

    event.locals.authenticated = true;

    return resolve(event);
};
