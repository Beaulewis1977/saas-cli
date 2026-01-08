import type { ColumnSpec } from '../types/index.js';
import { CLIError } from './error.js';

/**
 * Parse a column specification string into structured column definitions
 *
 * Format: name:type[:modifiers]
 * Modifiers: pk, fk(table.column), nullable, default(value), autoincrement
 *
 * Examples:
 *   id:int:pk
 *   title:text
 *   userId:uuid:fk(auth.users.id)
 *   createdAt:datetime:default(now())
 *   synced:bool:default(false)
 *   email:text:nullable
 */
export function parseColumnSpec(spec: string): ColumnSpec[] {
  const columns: ColumnSpec[] = [];
  const parts = spec.split(',').map((s) => s.trim());

  for (const part of parts) {
    if (!part) continue;

    const column = parseColumn(part);
    columns.push(column);
  }

  return columns;
}

/**
 * Parse a single column definition
 */
function parseColumn(definition: string): ColumnSpec {
  const segments = definition.split(':').map((s) => s.trim());

  if (segments.length < 2) {
    throw new CLIError(
      `Invalid column definition: "${definition}"`,
      1,
      'Format: name:type[:modifiers] (e.g., id:int:pk, title:text, userId:uuid:fk(auth.users.id))',
    );
  }

  const [name, type, ...modifiers] = segments;

  if (!name || !type) {
    throw new CLIError(
      `Missing name or type in column: "${definition}"`,
      1,
      'Each column must have a name and type',
    );
  }

  const column: ColumnSpec = {
    name,
    type: normalizeType(type),
  };

  // Parse modifiers
  for (const mod of modifiers) {
    parseModifier(column, mod);
  }

  return column;
}

/**
 * Parse a modifier and apply it to the column
 */
function parseModifier(column: ColumnSpec, modifier: string): void {
  const mod = modifier.toLowerCase();

  // Primary key
  if (mod === 'pk' || mod === 'primarykey' || mod === 'primary_key') {
    column.isPrimaryKey = true;
    return;
  }

  // Auto increment
  if (mod === 'autoincrement' || mod === 'auto_increment' || mod === 'serial') {
    column.isAutoIncrement = true;
    return;
  }

  // Nullable
  if (mod === 'nullable' || mod === 'null') {
    column.isNullable = true;
    return;
  }

  // Foreign key: fk(table.column) or fk(table)
  const fkMatch = modifier.match(/^fk\(([^)]+)\)$/i);
  if (fkMatch) {
    column.isForeignKey = true;
    const ref = fkMatch[1]!;
    const parts = ref.split('.');
    if (parts.length >= 2) {
      column.foreignKeyTable = parts.slice(0, -1).join('.');
      column.foreignKeyColumn = parts[parts.length - 1];
    } else {
      column.foreignKeyTable = ref;
      column.foreignKeyColumn = 'id';
    }
    return;
  }

  // Default value: default(value) - handles nested parens like now()
  const defaultMatch = modifier.match(/^default\((.+)\)$/i);
  if (defaultMatch) {
    column.defaultValue = defaultMatch[1] ?? '';
    return;
  }

  throw new CLIError(
    `Unknown modifier: "${modifier}"`,
    1,
    'Valid modifiers: pk, fk(table.column), nullable, default(value), autoincrement',
  );
}

/**
 * Normalize type names
 */
function normalizeType(type: string): string {
  const typeMap: Record<string, string> = {
    str: 'text',
    string: 'text',
    varchar: 'text',
    char: 'text',
    int: 'integer',
    number: 'integer',
    bigint: 'bigint',
    float: 'real',
    double: 'real',
    decimal: 'real',
    bool: 'boolean',
    boolean: 'boolean',
    date: 'datetime',
    timestamp: 'datetime',
    timestamptz: 'datetime',
    time: 'datetime',
    datetime: 'datetime',
    uuid: 'uuid',
    json: 'jsonb',
    jsonb: 'jsonb',
    blob: 'blob',
    bytes: 'blob',
    binary: 'blob',
  };

  return typeMap[type.toLowerCase()] || type.toLowerCase();
}

/**
 * Convert columns to SQL CREATE TABLE statement
 */
export function columnsToSQL(tableName: string, columns: ColumnSpec[]): string {
  const lines: string[] = [];

  for (const col of columns) {
    let line = `  ${toSnakeCase(col.name)} ${sqlType(col.type)}`;

    if (col.isPrimaryKey && col.isAutoIncrement) {
      line = `  ${toSnakeCase(col.name)} ${col.type === 'uuid' ? 'UUID DEFAULT gen_random_uuid()' : 'SERIAL'} PRIMARY KEY`;
    } else if (col.isPrimaryKey) {
      line += ' PRIMARY KEY';
    }

    if (!col.isNullable && !col.isPrimaryKey) {
      line += ' NOT NULL';
    }

    if (col.defaultValue !== undefined && !col.isPrimaryKey) {
      line += ` DEFAULT ${formatDefaultValue(col.defaultValue, col.type)}`;
    }

    if (col.isForeignKey && col.foreignKeyTable) {
      line += ` REFERENCES ${col.foreignKeyTable}(${col.foreignKeyColumn || 'id'}) ON DELETE CASCADE`;
    }

    lines.push(line);
  }

  return `CREATE TABLE ${toSnakeCase(tableName)} (\n${lines.join(',\n')}\n);`;
}

/**
 * Convert columns to Drift table definition
 */
export function columnsToDrift(tableName: string, columns: ColumnSpec[]): string {
  const lines: string[] = [`class ${toPascalCase(tableName)} extends Table {`];

  for (const col of columns) {
    lines.push(driftColumn(col));
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Generate a single Drift column definition
 */
function driftColumn(col: ColumnSpec): string {
  const driftType = getDriftType(col.type);
  let line = `  ${driftType}Column get ${toCamelCase(col.name)} => ${driftType}()`;

  if (col.isPrimaryKey && col.isAutoIncrement) {
    line += '.autoIncrement()';
  }

  if (col.isNullable) {
    line += '.nullable()';
  }

  if (col.defaultValue !== undefined) {
    const dartDefault = formatDartDefault(col.defaultValue, col.type);
    line += `.withDefault(${dartDefault})`;
  }

  line += '();';
  return line;
}

/**
 * Get Drift column type
 */
function getDriftType(type: string): string {
  const typeMap: Record<string, string> = {
    integer: 'integer',
    bigint: 'int64',
    text: 'text',
    boolean: 'boolean',
    real: 'real',
    datetime: 'dateTime',
    uuid: 'text',
    jsonb: 'text',
    blob: 'blob',
  };
  return typeMap[type] || 'text';
}

/**
 * Get SQL type
 */
function sqlType(type: string): string {
  const typeMap: Record<string, string> = {
    integer: 'INTEGER',
    bigint: 'BIGINT',
    text: 'TEXT',
    boolean: 'BOOLEAN',
    real: 'REAL',
    datetime: 'TIMESTAMPTZ',
    uuid: 'UUID',
    jsonb: 'JSONB',
    blob: 'BYTEA',
  };
  return typeMap[type] || 'TEXT';
}

/**
 * Format default value for SQL
 */
function formatDefaultValue(value: string, type: string): string {
  if (value === 'now()' || value === 'now') {
    return 'now()';
  }
  if (type === 'boolean') {
    return value.toLowerCase() === 'true' ? 'true' : 'false';
  }
  if (type === 'integer' || type === 'real' || type === 'bigint') {
    return value;
  }
  return `'${value}'`;
}

/**
 * Format default value for Dart
 */
function formatDartDefault(value: string, type: string): string {
  if (value === 'now()' || value === 'now') {
    return 'currentDateAndTime';
  }
  if (type === 'boolean') {
    return `const Constant(${value.toLowerCase() === 'true' ? 'true' : 'false'})`;
  }
  if (type === 'integer' || type === 'real' || type === 'bigint') {
    return `const Constant(${value})`;
  }
  return `const Constant('${value}')`;
}

// Case conversion helpers
function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()
    .replace(/^_/, '');
}

function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toLowerCase());
}

function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

export { toSnakeCase, toCamelCase, toPascalCase };
