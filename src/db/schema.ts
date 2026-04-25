import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  smallint,
  boolean,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const reportStatusEnum = pgEnum('report_status_enum', [
  'RECEIVED',
  'PROCESS',
  'REVIEW',
  'ASSISTANCE',
  'REJECTED',
  'DONE',
]);

export const user = pgTable('user', {
  id: uuid('id').primaryKey(), // ID akan diambil dari Supabase Auth, jadi kita hapus defaultRandom()
  name: varchar('name', { length: 255 }),
  profilePicture: text('profilePicture'),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phoneNumber: varchar('phoneNumber', { length: 50 }),
  nim: varchar('nim', { length: 50 }).unique(),
  department: varchar('department', { length: 255 }),
  faculty: varchar('faculty', { length: 255 }),
  enrollmentYear: smallint('enrollmentYear'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const admin = pgTable('admin', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  profilePicture: text('profilePicture'),
  email: varchar('email', { length: 255 }).notNull().unique(),
  unit: varchar('unit', { length: 255 }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const preference = pgTable('preference', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('userId').references(() => user.id, { onDelete: 'cascade' }),
  adminId: uuid('adminId').references(() => admin.id, { onDelete: 'cascade' }),
  emailReportStatus: boolean('emailReportStatus').notNull().default(true),
  emailWeeklySummary: boolean('emailWeeklySummary').notNull().default(false),
  emailSecurity: boolean('emailMonthlySummary').notNull().default(true),
  emailNewArticle: boolean('emailNewArticle').notNull().default(false),
  browserReportStatus: boolean('browserReportStatus').notNull().default(true),
  browserSecurity: boolean('browserSecurity').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const report = pgTable('report', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  adminId: uuid('adminId').references(() => admin.id, { onDelete: 'cascade' }),
  reportCode: varchar('reportCode', { length: 255 }).notNull().unique(),
  incident: varchar('incident', { length: 255 }).notNull(),
  date: timestamp('date').notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  incidentDesc: text('incidentDesc').notNull(),
  perpretatorDesc: text('perpreatorDesc').notNull(),
  status: reportStatusEnum('status').notNull().default('RECEIVED'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const evidenceAsset = pgTable('evidence_asset', {
  id: uuid('id').defaultRandom().primaryKey(),
  reportId: uuid('reportId')
    .notNull()
    .references(() => report.id, { onDelete: 'cascade' }),
  evidencePath: text('evidencePath').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const reportRelations = relations(report, ({ one, many }) => ({
  user: one(user, {
    fields: [report.userId],
    references: [user.id],
  }),
  admin: one(admin, {
    fields: [report.adminId],
    references: [admin.id],
  }),
  evidenceAssets: many(evidenceAsset),
}));

export const preferenceRelations = relations(preference, ({ one }) => ({
  user: one(user, {
    fields: [preference.userId],
    references: [user.id],
  }),
  admin: one(admin, {
    fields: [preference.adminId],
    references: [admin.id],
  }),
}));
