import { config } from '../config/config';

describe('Configuration', () => {
  test('should have required properties', () => {
    // Basic properties
    expect(config).toHaveProperty('PORT');
    expect(config).toHaveProperty('NODE_ENV');
    expect(config).toHaveProperty('MONGOURI');

    // JWT properties
    expect(config).toHaveProperty('JWT_SECRET');
    expect(config).toHaveProperty('ACCESS_TOKEN_SECRET');
    expect(config).toHaveProperty('ACCESS_TOKEN_LIFE');

    // Redis properties
    expect(config).toHaveProperty('REDIS_HOST');
    expect(config).toHaveProperty('REDIS_PORT');

    // Email properties
    expect(config).toHaveProperty('SMTP_HOST');
    expect(config).toHaveProperty('SMTP_PORT');
    expect(config).toHaveProperty('SMTP_USER');
    expect(config).toHaveProperty('SMTP_PASS');
    expect(config).toHaveProperty('SMTP_FROM');
  });
});