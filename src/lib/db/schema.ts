import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  jsonb,
  text,
  boolean,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ── Auth tables ──────────────────────────────────────────────

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('customer'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── App tables ───────────────────────────────────────────────

export const folders = pgTable('folders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  parentId: integer('parent_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  folderId: integer('folder_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const visualizations = pgTable('visualizations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  projectId: integer('project_id').notNull(),
  name: varchar('name', { length: 255 }).notNull().default('Untitled visualization'),
  chartType: varchar('chart_type', { length: 50 }).notNull().default('bar_stacked'),
  data: jsonb('data').notNull().default([]),
  settings: jsonb('settings').notNull().default({}),
  columnMapping: jsonb('column_mapping').default({}),
  thumbnail: text('thumbnail'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const reportVersions = pgTable('report_versions', {
  id: serial('id').primaryKey(),
  visualizationId: integer('visualization_id').notNull(),
  versionName: varchar('version_name', { length: 255 }).notNull(),
  width: integer('width'),
  height: integer('height'),
  isAutoSize: boolean('is_auto_size').default(true).notNull(),
  settingsSnapshot: jsonb('settings_snapshot'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const colorThemes = pgTable('color_themes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  name: varchar('name', { length: 255 }).notNull(),
  colors: jsonb('colors').notNull().$type<string[]>(),
  isBuiltIn: boolean('is_built_in').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const templates = pgTable('templates', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  templateName: varchar('template_name', { length: 255 }).notNull(),
  chartType: varchar('chart_type', { length: 50 }).notNull().default('bar_stacked_custom'),
  settings: jsonb('settings').notNull().default({}),
  data: jsonb('data').notNull().default([]),
  columnMapping: jsonb('column_mapping').default({}),
  thumbnail: text('thumbnail'),
  isShared: boolean('is_shared').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const preferences = pgTable('preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  key: varchar('key', { length: 100 }).notNull(),
  value: varchar('value', { length: 500 }).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('preferences_user_key_idx').on(table.userId, table.key),
]);

export const dashboardTemplates = pgTable('dashboard_templates', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  visualizationId: integer('visualization_id').notNull(),
  templateName: varchar('template_name', { length: 255 }).notNull(),
  dataSourceType: varchar('data_source_type', { length: 100 }),
  dataSourceConfig: jsonb('data_source_config').default({}),
  columnMappingTemplate: jsonb('column_mapping_template').default({}),
  refreshInterval: integer('refresh_interval').default(30),
  isRealtime: boolean('is_realtime').default(false),
  settingsSnapshot: jsonb('settings_snapshot').notNull().default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
