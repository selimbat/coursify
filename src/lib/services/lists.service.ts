import { db } from '$lib/server/db';
import { lists, type List } from '$lib/server/db/schema';
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

/**
 * Extracts unchecked checkbox items from a Markdown string.
 * Matches lines of the form `- [ ] ...`
 */
function extractUncheckedItems(markdown: string): string[] {
    return markdown.split('\n').filter((line) => /^- \[ \]/.test(line));
}

/**
 * Returns the unchecked items from the most recently updated non-template list.
 * Used to populate the confirmation dialog before creating a list from a template.
 */
export const getLastListUncheckedItems = async (): Promise<string[]> => {
    const lastLists = await db
        .select()
        .from(lists)
        .where(eq(lists.is_template, false))
        .orderBy(desc(lists.updated_at))
        .limit(1);

    const lastList = lastLists[0] ?? null;
    if (!lastList) return [];
    return extractUncheckedItems(lastList.markdown);
};

export const createList = async (
    title: string = 'Nouvelle liste',
    includeUnchecked: boolean = false
) => {
    let markdown = '';

    if (includeUnchecked) {
        const uncheckedItems = await getLastListUncheckedItems();
        if (uncheckedItems.length > 0) {
            markdown = '## Pas achetés la dernière fois\n' + uncheckedItems.join('\n');
        }
    }

    const [created] = await db
        .insert(lists)
        .values({
            title,
            status: 'ongoing',
            markdown,
            is_template: false,
            created_at: new Date(),
            updated_at: new Date()
        })
        .returning();
    return created;
};

export const updateList = async (
    id: string,
    data: Partial<Pick<List, 'title' | 'status' | 'markdown'>>
) => {
    const [updated] = await db
        .update(lists)
        .set({ ...data, updated_at: new Date() })
        .where(eq(lists.id, id))
        .returning();
    return updated ?? null;
};

export const deleteList = async (id: string) => {
    const [deleted] = await db
        .delete(lists)
        .where(eq(lists.id, id))
        .returning();
    return deleted ?? null;
};

export const createListFromTemplate = async (
    templateId: string,
    title: string = 'Nouvelle liste',
    includeUnchecked: boolean = true
) => {
    const template = await getListById(templateId);
    if (!template || !template.is_template) {
        throw new Error('Template introuvable');
    }

    let markdown = template.markdown;

    if (includeUnchecked) {
        const uncheckedItems = await getLastListUncheckedItems();
        if (uncheckedItems.length > 0) {
            const section =
                '\n\n## Pas achetés la dernière fois\n' + uncheckedItems.join('\n');
            markdown = markdown + section;
        }
    }

    const [created] = await db
        .insert(lists)
        .values({
            title,
            status: 'ongoing',
            markdown,
            is_template: false,
            created_at: new Date(),
            updated_at: new Date()
        })
        .returning();
    return created;
};