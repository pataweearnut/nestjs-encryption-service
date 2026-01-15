import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from '../crypto.service';
import * as crypto from 'crypto';

describe('CryptoService', () => {
  let service: CryptoService;

  const generateTestKeys = () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    return {
      publicKeyBase64: Buffer.from(publicKey).toString('base64'),
      privateKeyBase64: Buffer.from(privateKey).toString('base64'),
    };
  };

  const { publicKeyBase64, privateKeyBase64 } = generateTestKeys();

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'RSA_PUBLIC_KEY_BASE64') return publicKeyBase64;
      if (key === 'RSA_PRIVATE_KEY_BASE64') return privateKeyBase64;
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(CryptoService);
  });

  describe('encrypt', () => {
    it('should return data1 and data2 as base64 strings', () => {
      const result = service.encrypt('Hello World');

      expect(result.data1).toMatch(/^[A-Za-z0-9+/=]+$/);
      expect(result.data2).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('should be non-deterministic for same payload', () => {
      const a = service.encrypt('test');
      const b = service.encrypt('test');

      expect(a.data1).not.toBe(b.data1);
      expect(a.data2).not.toBe(b.data2);
    });
  });

  describe('decrypt', () => {
    it('should decrypt back to original payload', () => {
      const payload = 'Hello World';
      const encrypted = service.encrypt(payload);
      const decrypted = service.decrypt(encrypted.data1, encrypted.data2);

      expect(decrypted.payload).toBe(payload);
    });

    it('should throw if data2 is corrupted', () => {
      const encrypted = service.encrypt('test');

      expect(() => {
        service.decrypt(encrypted.data1, encrypted.data2.slice(0, 10));
      }).toThrow();
    });

    it('should throw if AES key cannot be decrypted', async () => {
      const otherKeys = generateTestKeys();

      const module2 = await Test.createTestingModule({
        providers: [
          CryptoService,
          {
            provide: ConfigService,
            useValue: {
              get: (key: string) => {
                if (key === 'RSA_PUBLIC_KEY_BASE64') return otherKeys.publicKeyBase64;
                if (key === 'RSA_PRIVATE_KEY_BASE64') return otherKeys.privateKeyBase64;
              },
            },
          },
        ],
      }).compile();

      const service2 = module2.get(CryptoService);
      const encrypted = service.encrypt('secret');

      expect(() => {
        service2.decrypt(encrypted.data1, encrypted.data2);
      }).toThrow();
    });
  });

  describe('data structure', () => {
    it('data2 should contain iv + authTag + cipherText', () => {
      const encrypted = service.encrypt('test');
      const buffer = Buffer.from(encrypted.data2, 'base64');

      // IV (12) + authTag (16) = 28 bytes minimum
      expect(buffer.length).toBeGreaterThan(28);
    });
  });
});
