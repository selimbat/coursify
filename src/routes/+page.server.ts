import { getAllLists, getAllTemplates, createList } from '$lib/services/lists.service';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
    const lists = await getAllLists();
    const templates = await getAllTemplates();

    return { lists, templates };
};

export const actions: Actions = {
    createList: async () => {
        const list = await createList();
        redirect(303, `/lists/${list.id}`);
    }
};
