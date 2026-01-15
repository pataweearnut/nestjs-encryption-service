import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { EncryptResponseData } from './dto/encrypt-response.dto';
import { DecryptResponseData } from './dto/decrypt-response.dto';
import {
  loadPublicKey,
  loadPrivateKey,
  AES_ALGORITHM,
  AES_KEY_LENGTH,
  IV_LENGTH,
  AUTH_TAG_LENGTH,
} from '../config/rsa.config';

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private readonly RSA_PADDING = crypto.constants.RSA_PKCS1_PADDING;
  private readonly publicKey: Buffer;
  private readonly privateKey: Buffer;

  constructor(@Optional() configService?: ConfigService) {
    this.publicKey = loadPublicKey(configService);
    this.privateKey = loadPrivateKey(configService);
  }

  encrypt(payload: string): EncryptResponseData {
    this.logger.log('Start encrypt flow (AES-256-GCM)');

    try {
      // Generate AES key + IV
      const aesKey = crypto.randomBytes(AES_KEY_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);

      // Encrypt payload with AES-GCM
      const cipher = this.createGCMCipher(aesKey, iv);
      const encryptedPayload = Buffer.concat([
        cipher.update(payload, 'utf8'),
        cipher.final(),
      ]);
      const authTag = cipher.getAuthTag();

      // data2 result encrypted payload with AES key
      const data2 = Buffer.concat([iv, authTag, encryptedPayload]).toString(
        'base64',
      );

      // Encrypt AES key with RSA private key
      const encryptedAesKey = crypto.privateEncrypt(
        {
          key: this.privateKey,
          padding: this.RSA_PADDING,
        },
        aesKey,
      );

      // data1 result: Encrypted AES key with private key
      const data1 = encryptedAesKey.toString('base64');
      const response: EncryptResponseData = {
        data1,
        data2
      }
      this.logger.log('Encrypt flow completed');

      return response;
    } catch (error) {
      this.logger.error(`Encryption failed: ${error.message}`, error.stack);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  decrypt(data1: string, data2: string): DecryptResponseData {
    this.logger.log('Start decrypt flow (AES-256-GCM)');

    try {
      // Decrypt AES key with RSA public key
      const aesKey = crypto.publicDecrypt(
        {
          key: this.publicKey,
          padding: this.RSA_PADDING,
        },
        Buffer.from(data1, 'base64'),
      );

      // Parse data2
      const buffer = Buffer.from(data2, 'base64');
      
      if (buffer.length < IV_LENGTH + AUTH_TAG_LENGTH) {
        throw new Error('Invalid data2 format: insufficient length');
      }

      const iv = buffer.subarray(0, IV_LENGTH);
      const authTag = buffer.subarray(
        IV_LENGTH,
        IV_LENGTH + AUTH_TAG_LENGTH,
      );
      const encryptedPayload = buffer.subarray(
        IV_LENGTH + AUTH_TAG_LENGTH,
      );

      // Decrypt payload with AES-GCM
      const decipher = this.createGCMDecipher(aesKey, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encryptedPayload),
        decipher.final(),
      ]);

      const payload = decrypted.toString('utf8');
      const response: DecryptResponseData = {
        payload: payload
      }
      this.logger.log('Decrypt flow completed');

      return response;
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`, error.stack);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  private createGCMCipher(
    key: Buffer,
    iv: Buffer,
  ): crypto.CipherGCM {
    const cipher = crypto.createCipheriv(AES_ALGORITHM, key, iv);
    // Type guard: verify it's a GCM cipher
    if ('getAuthTag' in cipher && typeof cipher.getAuthTag === 'function') {
      return cipher as crypto.CipherGCM;
    }
    throw new Error('Failed to create GCM cipher');
  }

  private createGCMDecipher(
    key: Buffer,
    iv: Buffer,
  ): crypto.DecipherGCM {
    const decipher = crypto.createDecipheriv(AES_ALGORITHM, key, iv);
    // Type guard: verify it's a GCM decipher
    if ('setAuthTag' in decipher && typeof decipher.setAuthTag === 'function') {
      return decipher as crypto.DecipherGCM;
    }
    throw new Error('Failed to create GCM decipher');
  }
}
