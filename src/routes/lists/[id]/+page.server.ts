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
        const list = await getListById(params.id);
        if (!list) error(404, 'Liste introuvable');

        const data = await request.formData();
        const title = data.get('title');
        const status = data.get('status');

        const patch: Partial<Pick<List, 'title' | 'status'>> = {};

        if (typeof title === 'string') patch.title = title.trim();
        // Status is meaningless for templates — only update for regular lists
        if (!list.is_template && (status === 'ongoing' || status === 'pending' || status === 'done')) {
            patch.status = status;
        }

        const updated = await updateList(params.id, patch);
        if (!updated) error(404, 'Liste introuvable');

        return { success: true };
    },

    saveMarkdown: async ({ request, params }) => {
        const data = await request.formData();
        const markdown = data.get('markdown');

        if (typeof markdown !== 'string') error(400, 'Markdown invalide');

        const updated = await updateList(params.id, { markdown });
        if (!updated) error(404, 'Liste introuvable');

        return { success: true };
    },

    delete: async ({ params }) => {
        const list = await getListById(params.id);
        if (!list) error(404, 'Liste introuvable');

        // Prevent deletion of the template — it must remain accessible for new list creation
        if (list.is_template) error(403, 'Impossible de supprimer le modèle de liste');

        await deleteList(params.id);
        redirect(303, '/');
    }
};
