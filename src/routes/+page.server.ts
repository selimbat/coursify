import { getAllLists, getAllTemplates } from '$lib/services/lists.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const lists = await getAllLists();
    const templates = await getAllTemplates();

    return { lists, templates };
};
