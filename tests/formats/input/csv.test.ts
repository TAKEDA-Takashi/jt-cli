import { describe, expect, it } from 'vitest';
import { ErrorCode, JtError } from '../../../src/errors';
import { parseCsv } from '../../../src/formats/input/csv';

describe('parseCsv', () => {
  describe('valid CSV', () => {
    it('should parse a simple CSV with headers', () => {
      const input = 'name,age\nAlice,30\nBob,25';
      const result = parseCsv(input);
      expect(result).toEqual([
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '25' },
      ]);
    });

    it('should parse CSV with quoted fields', () => {
      const input =
        'name,description\n"Smith, John","A person with, comma"\n"Doe","Simple description"';
      const result = parseCsv(input);
      expect(result).toEqual([
        { name: 'Smith, John', description: 'A person with, comma' },
        { name: 'Doe', description: 'Simple description' },
      ]);
    });

    it('should parse CSV with empty values', () => {
      const input = 'name,age,city\nAlice,30,\nBob,,Tokyo';
      const result = parseCsv(input);
      expect(result).toEqual([
        { name: 'Alice', age: '30', city: '' },
        { name: 'Bob', age: '', city: 'Tokyo' },
      ]);
    });

    it('should parse CSV with unicode characters', () => {
      const input = 'name,message\n太郎,こんにちは世界\nJohn,Hello 🌍';
      const result = parseCsv(input);
      expect(result).toEqual([
        { name: '太郎', message: 'こんにちは世界' },
        { name: 'John', message: 'Hello 🌍' },
      ]);
    });

    it('should parse CSV with newlines in quoted fields', () => {
      const input = 'name,note\n"Alice","Line 1\nLine 2"\nBob,"Single line"';
      const result = parseCsv(input);
      expect(result).toEqual([
        { name: 'Alice', note: 'Line 1\nLine 2' },
        { name: 'Bob', note: 'Single line' },
      ]);
    });

    it('should parse CSV with escaped quotes', () => {
      const input = 'name,quote\n"Alice","She said ""Hello"""\nBob,"No quotes"';
      const result = parseCsv(input);
      expect(result).toEqual([
        { name: 'Alice', quote: 'She said "Hello"' },
        { name: 'Bob', quote: 'No quotes' },
      ]);
    });

    it('should handle numeric-like values as strings', () => {
      const input = 'id,value,decimal\n001,123,3.14\n002,456,2.71';
      const result = parseCsv(input);
      expect(result).toEqual([
        { id: '001', value: '123', decimal: '3.14' },
        { id: '002', value: '456', decimal: '2.71' },
      ]);
    });

    it('should parse CSV with mixed casing in headers', () => {
      const input = 'Name,AGE,City_Name\nAlice,30,Tokyo';
      const result = parseCsv(input);
      expect(result).toEqual([{ Name: 'Alice', AGE: '30', City_Name: 'Tokyo' }]);
    });

    it('should parse CSV with only headers (no data rows)', () => {
      const input = 'name,age,city';
      const result = parseCsv(input);
      expect(result).toEqual([]);
    });

    it('should parse CSV with trailing newline', () => {
      const input = 'name,age\nAlice,30\nBob,25\n';
      const result = parseCsv(input);
      expect(result).toEqual([
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '25' },
      ]);
    });
  });

  describe('invalid CSV', () => {
    it('should throw JtError for empty input', () => {
      const input = '';
      expect(() => parseCsv(input)).toThrow(JtError);
      try {
        parseCsv(input);
      } catch (error) {
        expect(error).toBeInstanceOf(JtError);
        expect((error as JtError).code).toBe(ErrorCode.INVALID_INPUT);
        expect((error as JtError).message).toContain('Invalid CSV input');
      }
    });

    it('should throw JtError for whitespace-only input', () => {
      const input = '   \n\t  ';
      expect(() => parseCsv(input)).toThrow(JtError);
    });

    it('should throw JtError for malformed CSV', () => {
      const input = 'name,age\n"Alice,30'; // Unclosed quote
      expect(() => parseCsv(input)).toThrow(JtError);
      try {
        parseCsv(input);
      } catch (error) {
        expect(error).toBeInstanceOf(JtError);
        expect((error as JtError).code).toBe(ErrorCode.INVALID_INPUT);
        expect((error as JtError).detail).toBeDefined();
      }
    });

    it('should throw JtError for inconsistent column count', () => {
      const input = 'name,age,city\nAlice,30\nBob,25,Tokyo,Extra';
      expect(() => parseCsv(input)).toThrow(JtError);
    });
  });

  describe('edge cases', () => {
    it('should handle CSV with BOM', () => {
      const input = '\uFEFFname,age\nAlice,30';
      const result = parseCsv(input);
      expect(result).toEqual([{ name: 'Alice', age: '30' }]);
    });

    it('should parse CSV with duplicate header names', () => {
      const input = 'name,name,age\nAlice,Bob,30';
      const result = parseCsv(input);
      // csv-parse typically appends numbers to duplicate headers
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      if (Array.isArray(result) && result[0]) {
        expect(result[0]).toHaveProperty('age', '30');
      }
    });

    it('should handle different line endings', () => {
      const inputCRLF = 'name,age\r\nAlice,30\r\nBob,25';
      const inputLF = 'name,age\nAlice,30\nBob,25';
      const expected = [
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '25' },
      ];
      expect(parseCsv(inputCRLF)).toEqual(expected);
      expect(parseCsv(inputLF)).toEqual(expected);
    });

    it('should parse CSV with spaces around values', () => {
      const input = 'name, age ,city\n Alice , 30 , Tokyo ';
      const result = parseCsv(input);
      expect(result).toEqual([{ name: ' Alice ', ' age ': ' 30 ', city: ' Tokyo ' }]);
    });
  });

  describe('noHeader option', () => {
    it('should parse CSV without headers using generated column names', () => {
      const input = 'Alice,30,Tokyo\nBob,25,Osaka';
      const result = parseCsv(input, true);
      expect(result).toEqual([
        { col1: 'Alice', col2: '30', col3: 'Tokyo' },
        { col1: 'Bob', col2: '25', col3: 'Osaka' },
      ]);
    });

    it('should handle empty values without headers', () => {
      const input = 'Alice,30,\nBob,,Tokyo';
      const result = parseCsv(input, true);
      expect(result).toEqual([
        { col1: 'Alice', col2: '30', col3: '' },
        { col1: 'Bob', col2: '', col3: 'Tokyo' },
      ]);
    });

    it('should handle quoted fields without headers', () => {
      const input = '"Smith, John","A person with, comma",30\n"Doe","Simple description",25';
      const result = parseCsv(input, true);
      expect(result).toEqual([
        { col1: 'Smith, John', col2: 'A person with, comma', col3: '30' },
        { col1: 'Doe', col2: 'Simple description', col3: '25' },
      ]);
    });

    it('should handle single column CSV without headers', () => {
      const input = 'Alice\nBob\nCharlie';
      const result = parseCsv(input, true);
      expect(result).toEqual([{ col1: 'Alice' }, { col1: 'Bob' }, { col1: 'Charlie' }]);
    });

    it('should handle many columns without headers', () => {
      const input = 'a,b,c,d,e,f,g,h,i,j,k\n1,2,3,4,5,6,7,8,9,10,11';
      const result = parseCsv(input, true);
      expect(result).toEqual([
        {
          col1: 'a',
          col2: 'b',
          col3: 'c',
          col4: 'd',
          col5: 'e',
          col6: 'f',
          col7: 'g',
          col8: 'h',
          col9: 'i',
          col10: 'j',
          col11: 'k',
        },
        {
          col1: '1',
          col2: '2',
          col3: '3',
          col4: '4',
          col5: '5',
          col6: '6',
          col7: '7',
          col8: '8',
          col9: '9',
          col10: '10',
          col11: '11',
        },
      ]);
    });

    it('should throw error for empty input with noHeader', () => {
      const input = '';
      expect(() => parseCsv(input, true)).toThrow(JtError);
    });

    it('should handle single row CSV without headers', () => {
      const input = 'Alice,30,Tokyo';
      const result = parseCsv(input, true);
      expect(result).toEqual([{ col1: 'Alice', col2: '30', col3: 'Tokyo' }]);
    });

    it('should handle CSV with newlines in quoted fields without headers', () => {
      const input = '"Alice","Line 1\nLine 2",30\nBob,"Single line",25';
      const result = parseCsv(input, true);
      expect(result).toEqual([
        { col1: 'Alice', col2: 'Line 1\nLine 2', col3: '30' },
        { col1: 'Bob', col2: 'Single line', col3: '25' },
      ]);
    });
  });
});
