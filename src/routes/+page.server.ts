import { getAllLists, getAllTemplates, createList, createListFromTemplate, getLastListUncheckedItems } from '$lib/services/lists.service';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
    const [lists, templates, uncheckedItems] = await Promise.all([
        getAllLists(),
        getAllTemplates(),
        getLastListUncheckedItems()
    ]);

    return { lists, templates, uncheckedItems };
};

export const actions: Actions = {
    createList: async ({ request }) => {
        const data = await request.formData();
        const includeUnchecked = data.get('includeUnchecked') !== 'false';
        const list = await createList('Nouvelle liste', includeUnchecked);
        redirect(303, `/lists/${list.id}`);
    },

    createFromTemplate: async ({ request }) => {
        const data = await request.formData();
        const templateId = data.get('templateId');
        const includeUnchecked = data.get('includeUnchecked') !== 'false';

        if (typeof templateId !== 'string' || !templateId) {
            error(400, 'Template ID manquant');
        }

        const list = await createListFromTemplate(templateId, 'Nouvelle liste', includeUnchecked);
        redirect(303, `/lists/${list.id}`);
    }
};
