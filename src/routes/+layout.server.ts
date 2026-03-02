import { USER_A, USER_B } from '$env/static/private';
import type { LayoutServerLoad } from './$types';

export const ssr = false;

export const load = (async () => {
    return {
        userLabels: {
            user_a: USER_A ?? 'Alice',
            user_b: USER_B ?? 'Bob'
        }
    };
}) satisfies LayoutServerLoad;