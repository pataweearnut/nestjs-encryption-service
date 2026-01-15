import { ConfigService } from '@nestjs/config';

// AES-GCM Configuration Constants
export const AES_ALGORITHM = 'aes-256-gcm';
export const AES_KEY_LENGTH = 32;
export const IV_LENGTH = 12;
export const AUTH_TAG_LENGTH = 16;

export function loadPublicKey(configService?: ConfigService): Buffer {
  const key = configService
    ? configService.get<string>('RSA_PUBLIC_KEY_BASE64')
    : process.env.RSA_PUBLIC_KEY_BASE64;

  if (!key) {
    throw new Error('RSA_PUBLIC_KEY_BASE64 is not set');
  }
  return Buffer.from(key, 'base64');
}

export function loadPrivateKey(configService?: ConfigService): Buffer {
  const key = configService
    ? configService.get<string>('RSA_PRIVATE_KEY_BASE64')
    : process.env.RSA_PRIVATE_KEY_BASE64;

  if (!key) {
    throw new Error('RSA_PRIVATE_KEY_BASE64 is not set');
  }
  return Buffer.from(key, 'base64');
}
