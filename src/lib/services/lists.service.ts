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

export const getListById = async (id: string) => {
    const results = await db.select().from(lists).where(eq(lists.id, id)).limit(1);
    return results[0] ?? null;
};

export const createList = async (title: string = 'Nouvelle liste') => {
    const [created] = await db
        .insert(lists)
        .values({
            title,
            status: 'ongoing',
            markdown: '',
            is_template: false,
            created_at: new Date(),
            updated_at: new Date()
        })
        .returning();
    return created;
};