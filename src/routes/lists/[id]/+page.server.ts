import { getListById, updateList, deleteList } from '$lib/services/lists.service';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { List } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ params }) => {
    const list = await getListById(params.id);

    if (!list) {
        error(404, 'Liste introuvable');
    }

    return { list };
};

export const actions: Actions = {
    update: async ({ request, params }) => {
        const data = await request.formData();
        const title = data.get('title');
        const status = data.get('status');

        const patch: Partial<Pick<List, 'title' | 'status'>> = {};

        if (typeof title === 'string') patch.title = title.trim();
        if (status === 'ongoing' || status === 'pending' || status === 'done') {
            patch.status = status;
        }

        const updated = await updateList(params.id, patch);
        if (!updated) error(404, 'Liste introuvable');

        return { success: true };
    },

    delete: async ({ params }) => {
        const list = await getListById(params.id);
        if (!list) error(404, 'Liste introuvable');

        await deleteList(params.id);
        redirect(303, '/');
    }
};
