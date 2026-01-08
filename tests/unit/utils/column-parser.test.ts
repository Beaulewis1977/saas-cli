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
    const columns = parseColumnSpec('userId:uuid:fk(auth.users)');
    const sql = columnsToSQL('posts', columns);

    // FK without column specified defaults to 'id'
    expect(sql).toContain('REFERENCES auth(users)');
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
});
