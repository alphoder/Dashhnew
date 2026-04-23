import { pgTable, uuid, text, real, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const creators = pgTable('creators', {
  id: uuid('id').defaultRandom().primaryKey(),
  solAdd: text('sol_add').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  label: text('label').notNull(),
  amount: real('amount').notNull(),
  icons: text('icons').notNull(),
  users: text('users').array().default([]),
  end: timestamp('end', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  solAdd: text('sol_add').notNull(),
  post: text('post').notNull(),
  isAwarded: boolean('is_awarded').default(false).notNull(),
  igProfile: text('ig_profile'),
  views: integer('views').default(0).notNull(),
  winningAmount: real('winning_amount').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
