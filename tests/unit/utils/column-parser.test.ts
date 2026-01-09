import { describe, expect, it } from 'vitest';
import { columnsToDrift, columnsToSQL, parseColumnSpec } from '../../../src/utils/column-parser.js';

describe('parseColumnSpec', () => {
  it('parses simple columns', () => {
    const result = parseColumnSpec('id:int,name:text');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'id', type: 'integer' });
    expect(result[1]).toEqual({ name: 'name', type: 'text' });
  });

  it('parses primary key modifier', () => {
    const result = parseColumnSpec('id:int:pk');
    expect(result[0]?.isPrimaryKey).toBe(true);
  });

  it('parses foreign key modifier', () => {
    const result = parseColumnSpec('userId:uuid:fk(auth.users.id)');
    expect(result[0]?.isForeignKey).toBe(true);
    expect(result[0]?.foreignKeyTable).toBe('auth.users');
    expect(result[0]?.foreignKeyColumn).toBe('id');
  });

  it('parses nullable modifier', () => {
    const result = parseColumnSpec('email:text:nullable');
    expect(result[0]?.isNullable).toBe(true);
  });

  it('parses default value modifier', () => {
    const result = parseColumnSpec('synced:bool:default(false)');
    expect(result[0]?.defaultValue).toBe('false');
  });

  it('normalizes type names', () => {
    const result = parseColumnSpec('name:string,count:int,flag:bool');
    expect(result[0]?.type).toBe('text');
    expect(result[1]?.type).toBe('integer');
    expect(result[2]?.type).toBe('boolean');
  });

  it('handles complex column spec', () => {
    const result = parseColumnSpec(
      'id:uuid:pk,title:text,userId:uuid:fk(auth.users),createdAt:datetime:default(now())',
    );
    expect(result).toHaveLength(4);
    expect(result[0]?.isPrimaryKey).toBe(true);
    expect(result[2]?.isForeignKey).toBe(true);
    expect(result[3]?.defaultValue).toBe('now()');
  });
});

describe('columnsToSQL', () => {
  it('generates SQL for simple table', () => {
    const columns = parseColumnSpec('id:int:pk,name:text');
    const sql = columnsToSQL('users', columns);

    expect(sql).toContain('CREATE TABLE users');
    expect(sql).toContain('INTEGER PRIMARY KEY');
    expect(sql).toContain('name TEXT NOT NULL');
  });

  it('generates SQL with foreign key', () => {
    // Format: fk(table.column) or fk(schema.table.column)
    const columns = parseColumnSpec('userId:uuid:fk(users.id)');
    const sql = columnsToSQL('posts', columns);

    expect(sql).toContain('REFERENCES users(id)');
  });

  it('defaults FK column to id when not specified', () => {
    const columns = parseColumnSpec('userId:uuid:fk(users)');
    const sql = columnsToSQL('posts', columns);

    // FK without column specified defaults to 'id'
    expect(sql).toContain('REFERENCES users(id)');
  });

  it('generates SQL with default value', () => {
    const columns = parseColumnSpec('active:bool:default(true)');
    const sql = columnsToSQL('settings', columns);

    expect(sql).toContain('DEFAULT true');
  });
});

describe('columnsToDrift', () => {
  it('generates Drift table definition', () => {
    const columns = parseColumnSpec('id:int:pk,title:text');
    const drift = columnsToDrift('Recipes', columns);

    expect(drift).toContain('class Recipes extends Table');
    expect(drift).toContain('integerColumn get id');
    expect(drift).toContain('textColumn get title');
  });

  it('handles nullable columns', () => {
    const columns = parseColumnSpec('description:text:nullable');
    const drift = columnsToDrift('Items', columns);

    expect(drift).toContain('.nullable()');
  });

  it('handles default values', () => {
    const columns = parseColumnSpec('synced:bool:default(false)');
    const drift = columnsToDrift('Records', columns);

    expect(drift).toContain('.withDefault(');
  });

  it('escapes single quotes in string default values', () => {
    const columns = parseColumnSpec("name:text:default(O'Brien)");
    const drift = columnsToDrift('Users', columns);

    // Should escape the single quote for valid Dart syntax
    expect(drift).toContain("const Constant('O\\'Brien')");
  });
});

describe('security: SQL injection prevention', () => {
  it('rejects invalid column names', () => {
    expect(() => parseColumnSpec('id;DROP TABLE users:int')).toThrow();
    expect(() => parseColumnSpec("user's:text")).toThrow();
    expect(() => parseColumnSpec('user-id:int')).toThrow();
  });

  it('rejects invalid table names in columnsToSQL', () => {
    const columns = parseColumnSpec('id:int:pk');
    expect(() => columnsToSQL('users; DROP TABLE users;--', columns)).toThrow();
    expect(() => columnsToSQL('table-name', columns)).toThrow();
  });

  it('rejects invalid table names in columnsToDrift', () => {
    const columns = parseColumnSpec('id:int:pk');
    expect(() => columnsToDrift('users; DROP TABLE users;--', columns)).toThrow();
    expect(() => columnsToDrift('table-name', columns)).toThrow();
  });

  it('rejects invalid foreign key table names', () => {
    expect(() => parseColumnSpec('userId:uuid:fk(auth;DROP TABLE users.id)')).toThrow();
    expect(() => parseColumnSpec("userId:uuid:fk(auth'---.id)")).toThrow();
  });

  it('rejects invalid foreign key column names', () => {
    expect(() => parseColumnSpec('userId:uuid:fk(auth.users.id;DROP TABLE)')).toThrow();
    expect(() => parseColumnSpec("userId:uuid:fk(auth.users.id')")).toThrow();
  });

  it('accepts valid identifiers with underscores and numbers', () => {
    expect(() => parseColumnSpec('user_id:int,post_count_2:int')).not.toThrow();
    const columns = parseColumnSpec('user_id:int');
    expect(() => columnsToSQL('user_posts_v2', columns)).not.toThrow();
  });
});
