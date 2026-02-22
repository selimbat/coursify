import { getListById } from '$lib/services/lists.service';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const list = await getListById(params.id);

    if (!list) {
        error(404, 'Liste introuvable');
    }

    return { list };
};
