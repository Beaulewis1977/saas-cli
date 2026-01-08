import { describe, expect, it } from 'vitest';
import { Handlebars, renderInline } from '../../../src/services/template.js';

describe('template service', () => {
  describe('renderInline', () => {
    it('renders simple templates', () => {
      const result = renderInline('Hello {{name}}!', { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('handles missing variables', () => {
      const result = renderInline('Hello {{name}}!', {});
      expect(result).toBe('Hello !');
    });
  });

  describe('Handlebars helpers', () => {
    it('camelCase converts strings', () => {
      const result = renderInline('{{camelCase name}}', { name: 'user-list' });
      expect(result).toBe('userList');
    });

    it('pascalCase converts strings', () => {
      const result = renderInline('{{pascalCase name}}', { name: 'user-list' });
      expect(result).toBe('UserList');
    });

    it('snakeCase converts strings', () => {
      const result = renderInline('{{snakeCase name}}', { name: 'UserList' });
      expect(result).toBe('user_list');
    });

    it('kebabCase converts strings', () => {
      const result = renderInline('{{kebabCase name}}', { name: 'UserList' });
      expect(result).toBe('user-list');
    });

    it('singularize removes s', () => {
      const result = renderInline('{{singularize name}}', { name: 'users' });
      expect(result).toBe('user');
    });

    it('singularize handles -ies', () => {
      const result = renderInline('{{singularize name}}', { name: 'entries' });
      expect(result).toBe('entry');
    });

    it('pluralize adds s', () => {
      const result = renderInline('{{pluralize name}}', { name: 'user' });
      expect(result).toBe('users');
    });

    it('pluralize handles y -> ies', () => {
      const result = renderInline('{{pluralize name}}', { name: 'entry' });
      expect(result).toBe('entries');
    });

    it('eq helper works', () => {
      const result = renderInline('{{#if (eq a b)}}yes{{else}}no{{/if}}', { a: 'x', b: 'x' });
      expect(result).toBe('yes');
    });

    it('dartType maps SQL types', () => {
      expect(renderInline('{{dartType type}}', { type: 'text' })).toBe('String');
      expect(renderInline('{{dartType type}}', { type: 'integer' })).toBe('int');
      expect(renderInline('{{dartType type}}', { type: 'boolean' })).toBe('bool');
      expect(renderInline('{{dartType type}}', { type: 'datetime' })).toBe('DateTime');
    });

    it('driftColumn maps SQL types', () => {
      expect(renderInline('{{driftColumn type}}', { type: 'text' })).toBe('text');
      expect(renderInline('{{driftColumn type}}', { type: 'integer' })).toBe('integer');
      expect(renderInline('{{driftColumn type}}', { type: 'boolean' })).toBe('boolean');
    });
  });
});
