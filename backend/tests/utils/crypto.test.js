const { hashPassword, verifyPassword } = require('../../utils/crypto');

describe('crypto utilities', () => {
  test('hashPassword returns hash and salt', async () => {
    const { hash, salt } = await hashPassword('my-password');
    expect(typeof hash).toBe('string');
    expect(typeof salt).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
    expect(salt.length).toBe(64); // 32 bytes as hex
  });

  test('verifyPassword returns true for correct password', async () => {
    const { hash, salt } = await hashPassword('correct-password');
    const result = await verifyPassword('correct-password', hash, salt);
    expect(result).toBe(true);
  });

  test('verifyPassword returns false for wrong password', async () => {
    const { hash, salt } = await hashPassword('correct-password');
    const result = await verifyPassword('wrong-password', hash, salt);
    expect(result).toBe(false);
  });

  test('same password produces different hashes each call (salt randomness)', async () => {
    const first = await hashPassword('same-password');
    const second = await hashPassword('same-password');
    expect(first.hash).not.toBe(second.hash);
    expect(first.salt).not.toBe(second.salt);
  });
});
