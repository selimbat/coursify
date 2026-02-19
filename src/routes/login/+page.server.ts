import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { verifyPassphrase, createToken, AUTH_COOKIE_NAME } from '$lib/services/auth.service';

export const actions: Actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const passphrase = data.get('passphrase');

        if (!passphrase || typeof passphrase !== 'string') {
            return fail(400, { error: 'Phrase secrète requise.' });
        }

        if (!verifyPassphrase(passphrase)) {
            return fail(401, { error: 'Phrase secrète incorrecte.' });
        }

        const token = await createToken();

        cookies.set(AUTH_COOKIE_NAME, token, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        });

        redirect(303, '/');
    }
};
