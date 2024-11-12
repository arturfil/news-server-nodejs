import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('articles', {
    id: { type: 'serial', primaryKey: true },
    title: { type: 'varchar(255)', notNull: true },
    content: { type: 'text', notNull: true },
    summary: { type: 'text' },
    state: { type: 'varchar(50)' },
    topic: { type: 'varchar(50)' },
    published_date: { type: 'timestamp' },
    source_url: { type: 'text' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Add indexes for commonly queried fields
  pgm.createIndex('articles', 'state');
  pgm.createIndex('articles', 'topic');
  pgm.createIndex('articles', 'published_date');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('articles');
}
