import { ErrorCode, JtError } from '../src/errors';
import { executeQuery } from '../src/query';

describe('executeQuery', () => {
  describe('basic queries', () => {
    it('should execute simple property access', async () => {
      const data = { name: 'Alice', age: 30 };
      const query = '$.name';
      const result = await executeQuery(query, data);
      expect(result).toBe('Alice');
    });

    it('should execute array access', async () => {
      const data = [1, 2, 3, 4, 5];
      const query = '$[2]';
      const result = await executeQuery(query, data);
      expect(result).toBe(3);
    });

    it('should execute nested property access', async () => {
      const data = {
        users: {
          alice: { age: 30, city: 'Tokyo' },
          bob: { age: 25, city: 'Osaka' },
        },
      };
      const query = '$.users.alice.city';
      const result = await executeQuery(query, data);
      expect(result).toBe('Tokyo');
    });

    it('should return whole data with $ query', async () => {
      const data = { test: 'value' };
      const query = '$';
      const result = await executeQuery(query, data);
      expect(result).toEqual(data);
    });
  });

  describe('filtering and mapping', () => {
    it('should filter array elements', async () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ];
      const query = '$[age > 28]';
      const result = await executeQuery(query, data);
      expect(result).toEqual([
        { name: 'Alice', age: 30 },
        { name: 'Charlie', age: 35 },
      ]);
    });

    it('should map array elements', async () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ];
      const query = '$.name';
      const result = await executeQuery(query, data);
      expect(result).toEqual(['Alice', 'Bob']);
    });

    it('should handle complex transformations', async () => {
      const data = {
        users: [
          { firstName: 'John', lastName: 'Doe', age: 30 },
          { firstName: 'Jane', lastName: 'Smith', age: 25 },
        ],
      };
      const query = 'users.{"fullName": firstName & " " & lastName, "age": age}';
      const result = await executeQuery(query, data);
      expect(result).toEqual([
        { fullName: 'John Doe', age: 30 },
        { fullName: 'Jane Smith', age: 25 },
      ]);
    });
  });

  describe('aggregation functions', () => {
    it('should calculate sum', async () => {
      const data = [{ value: 10 }, { value: 20 }, { value: 30 }];
      const query = '$sum(value)';
      const result = await executeQuery(query, data);
      expect(result).toBe(60);
    });

    it('should calculate count', async () => {
      const data = ['a', 'b', 'c', 'd'];
      const query = '$count($)';
      const result = await executeQuery(query, data);
      expect(result).toBe(4);
    });

    it('should calculate average', async () => {
      const data = [10, 20, 30, 40];
      const query = '$average($)';
      const result = await executeQuery(query, data);
      expect(result).toBe(25);
    });
  });

  describe('string functions', () => {
    it('should uppercase string', async () => {
      const data = { message: 'hello world' };
      const query = '$uppercase(message)';
      const result = await executeQuery(query, data);
      expect(result).toBe('HELLO WORLD');
    });

    it('should concatenate strings', async () => {
      const data = { first: 'Hello', second: 'World' };
      const query = 'first & " " & second';
      const result = await executeQuery(query, data);
      expect(result).toBe('Hello World');
    });

    it('should substring', async () => {
      const data = { text: 'Hello World' };
      const query = '$substring(text, 0, 5)';
      const result = await executeQuery(query, data);
      expect(result).toBe('Hello');
    });
  });

  describe('edge cases', () => {
    it('should handle null data', async () => {
      const data = null;
      const query = '$';
      const result = await executeQuery(query, data);
      expect(result).toBe(null);
    });

    it('should handle undefined properties', async () => {
      const data = { a: 1 };
      const query = '$.b';
      const result = await executeQuery(query, data);
      expect(result).toBeUndefined();
    });

    it('should handle empty arrays', async () => {
      const data: unknown[] = [];
      const query = '$sum($)';
      const result = await executeQuery(query, data);
      expect(result).toBe(0);
    });

    it('should handle empty objects', async () => {
      const data = {};
      const query = '$keys($)';
      const result = await executeQuery(query, data);
      expect(result).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid query syntax', async () => {
      const data = { test: 'value' };
      const query = '$(invalid';
      await expect(executeQuery(query, data)).rejects.toThrow(JtError);
    });

    it('should provide helpful error for syntax errors', async () => {
      const data = { test: 'value' };
      const query = '${invalid syntax}';
      try {
        await executeQuery(query, data);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(JtError);
        // This specific query might throw execution error instead of syntax error
        // depending on JSONata version, so accept both
        expect([ErrorCode.INVALID_QUERY, ErrorCode.EXECUTION_ERROR]).toContain(
          (error as JtError).code,
        );
        expect((error as JtError).detail).toBeDefined();
      }
    });

    it('should handle runtime errors gracefully', async () => {
      const data = { value: 'not a number' };
      const query = 'value + 10';
      await expect(executeQuery(query, data)).rejects.toThrow(JtError);
    });

    it('should handle function errors', async () => {
      const data = { text: null };
      const query = '$uppercase(text)';
      await expect(executeQuery(query, data)).rejects.toThrow(JtError);
    });
  });

  describe('complex real-world queries', () => {
    it('should handle shopping cart total calculation', async () => {
      const data = {
        cart: [
          { item: 'Book', price: 15.99, quantity: 2 },
          { item: 'Pen', price: 1.99, quantity: 5 },
          { item: 'Notebook', price: 5.99, quantity: 3 },
        ],
      };
      const query = '$sum(cart.(price * quantity))';
      const result = await executeQuery(query, data);
      expect(result).toBeCloseTo(59.9, 1);
    });

    it('should group and aggregate data', async () => {
      const data = [
        { department: 'Sales', employee: 'Alice', salary: 50000 },
        { department: 'Sales', employee: 'Bob', salary: 60000 },
        { department: 'IT', employee: 'Charlie', salary: 70000 },
        { department: 'IT', employee: 'David', salary: 65000 },
      ];
      const query = '${department: $sum(salary)}';
      const result = await executeQuery(query, data);
      expect(result).toEqual({
        Sales: 110000,
        IT: 135000,
      });
    });
  });
});
