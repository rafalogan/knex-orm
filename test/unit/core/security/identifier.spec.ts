import { isValidSqlIdentifier, assertValidSqlIdentifier } from '@core/security/identifier';

describe('identifier security', () => {
  describe('isValidSqlIdentifier', () => {
    it('should return true for valid identifiers', () => {
      expect(isValidSqlIdentifier('users')).toBe(true);
      expect(isValidSqlIdentifier('user_id')).toBe(true);
      expect(isValidSqlIdentifier('_private')).toBe(true);
      expect(isValidSqlIdentifier('a1')).toBe(true);
    });

    it('should return false for invalid identifiers', () => {
      expect(isValidSqlIdentifier('')).toBe(false);
      expect(isValidSqlIdentifier("users'; DROP TABLE users--")).toBe(false);
      expect(isValidSqlIdentifier('user-id')).toBe(false);
      expect(isValidSqlIdentifier('user.id')).toBe(false);
      expect(isValidSqlIdentifier('1user')).toBe(false);
    });
  });

  describe('assertValidSqlIdentifier', () => {
    it('should not throw for valid identifiers', () => {
      expect(() => assertValidSqlIdentifier('users')).not.toThrow();
      expect(() => assertValidSqlIdentifier('created_at')).not.toThrow();
    });

    it('should throw TypeError for invalid identifiers', () => {
      expect(() => assertValidSqlIdentifier("'; DROP TABLE users--")).toThrow(
        TypeError,
      );
      expect(() => assertValidSqlIdentifier('', '@Entity')).toThrow(TypeError);
    });
  });
});
