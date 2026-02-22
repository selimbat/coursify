import { db } from '$lib/server/db';
import { lists } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';


export const getAllLists = async () => {
    return await db
        .select()
        .from(lists)
        .where(eq(lists.is_template, false))
        .orderBy(desc(lists.created_at));
};

export const getAllTemplates = async () => {
    return await db
        .select()
        .from(lists)
        .where(eq(lists.is_template, true))
        .orderBy(desc(lists.created_at));
};