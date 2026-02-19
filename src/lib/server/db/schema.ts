import { pgTable, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const listStatusEnum = pgEnum('list_status', ['ongoing', 'pending', 'done']);
export const lastModifiedByEnum = pgEnum('last_modified_by_user', ['user_a', 'user_b']);

export const lists = pgTable('lists', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull().default(''),
	status: listStatusEnum('status').notNull().default('ongoing'),
	markdown: text('markdown').notNull().default(''),
	is_template: boolean('is_template').notNull().default(false),
	created_at: timestamp('created_at', { withTimezone: true }),
	updated_at: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.$defaultFn(() => new Date()),
	last_modified_by: lastModifiedByEnum('last_modified_by')
});
