import { Test, TestingModule } from '@nestjs/testing';
import { CryptoController } from '../crypto.controller';
import { CryptoService } from '../crypto.service';
import { EncryptRequestDto } from '../dto/encrypt-request.dto';
import { DecryptRequestDto } from '../dto/decrypt-request.dto';
import { BaseResponse } from '../../common/response/base-response';
import { EncryptResponseData } from '../dto/encrypt-response.dto';
import { DecryptResponseData } from '../dto/decrypt-response.dto';

describe('CryptoController', () => {
  let controller: CryptoController;
  let cryptoService: jest.Mocked<CryptoService>;

  const mockEncryptResponse: EncryptResponseData = {
    data1: 'encrypted-aes-key-base64',
    data2: 'encrypted-payload-base64',
  };

  const mockDecryptResponse: DecryptResponseData = {
    payload: 'decrypted payload',
  };

  beforeEach(async () => {
    const mockCryptoService = {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CryptoController],
      providers: [
        {
          provide: CryptoService,
          useValue: mockCryptoService,
        },
      ],
    }).compile();

    controller = module.get<CryptoController>(CryptoController);
    cryptoService = module.get(CryptoService);
  });

  describe('POST /get-encrypt-data', () => {
    it('should encrypt payload successfully', () => {
      const requestDto: EncryptRequestDto = {
        payload: 'Hello World',
      };

      cryptoService.encrypt.mockReturnValue(mockEncryptResponse);

      const result = controller.encrypt(requestDto);

      expect(cryptoService.encrypt).toHaveBeenCalledWith('Hello World');
      expect(cryptoService.encrypt).toHaveBeenCalledTimes(1);
      expect(result).toEqual(BaseResponse.success(mockEncryptResponse));
      expect(result.successful).toBe(true);
      expect(result.error_code).toBe('');
      expect(result.data).toEqual(mockEncryptResponse);
    });

    it('should return BaseResponse format', () => {
      const requestDto: EncryptRequestDto = {
        payload: 'Test message',
      };

      cryptoService.encrypt.mockReturnValue(mockEncryptResponse);

      const result = controller.encrypt(requestDto);

      expect(result).toHaveProperty('successful');
      expect(result).toHaveProperty('error_code');
      expect(result).toHaveProperty('data');
      expect(result.successful).toBe(true);
    });

    it('should handle different payloads', () => {
      const testCases = [
        'Short',
        'A'.repeat(100),
        'A'.repeat(2000), // Max length
        'Special chars: !@#$%^&*()',
        'Unicode: 你好世界 🌍',
      ];

      testCases.forEach((payload) => {
        const requestDto: EncryptRequestDto = { payload };
        cryptoService.encrypt.mockReturnValue(mockEncryptResponse);

        const result = controller.encrypt(requestDto);

        expect(cryptoService.encrypt).toHaveBeenCalledWith(payload);
        expect(result.successful).toBe(true);
        expect(result.data).toEqual(mockEncryptResponse);
      });
    });

    it('should propagate encryption errors', () => {
      const requestDto: EncryptRequestDto = {
        payload: 'Test',
      };

      const errorMessage = 'Encryption failed: Invalid key';
      cryptoService.encrypt.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      expect(() => controller.encrypt(requestDto)).toThrow(errorMessage);
      expect(cryptoService.encrypt).toHaveBeenCalledWith('Test');
    });
  });

  describe('POST /get-decrypt-data', () => {
    it('should decrypt data successfully', () => {
      const requestDto: DecryptRequestDto = {
        data1: 'encrypted-aes-key',
        data2: 'encrypted-payload',
      };

      cryptoService.decrypt.mockReturnValue(mockDecryptResponse);

      const result = controller.decrypt(requestDto);

      expect(cryptoService.decrypt).toHaveBeenCalledWith(
        'encrypted-aes-key',
        'encrypted-payload',
      );
      expect(cryptoService.decrypt).toHaveBeenCalledTimes(1);
      expect(result).toEqual(BaseResponse.success(mockDecryptResponse));
      expect(result.successful).toBe(true);
      expect(result.error_code).toBe('');
      expect(result.data).toEqual(mockDecryptResponse);
    });

    it('should return BaseResponse format', () => {
      const requestDto: DecryptRequestDto = {
        data1: 'key1',
        data2: 'data2',
      };

      cryptoService.decrypt.mockReturnValue(mockDecryptResponse);

      const result = controller.decrypt(requestDto);

      expect(result).toHaveProperty('successful');
      expect(result).toHaveProperty('error_code');
      expect(result).toHaveProperty('data');
      expect(result.successful).toBe(true);
    });

    it('should handle different encrypted data', () => {
      const testCases = [
        {
          data1: 'key1',
          data2: 'data1',
        },
        {
          data1: 'A'.repeat(100),
          data2: 'B'.repeat(200),
        },
        {
          data1: 'base64encodedkey',
          data2: 'base64encodeddata',
        },
      ];

      testCases.forEach((requestDto) => {
        cryptoService.decrypt.mockReturnValue(mockDecryptResponse);

        const result = controller.decrypt(requestDto);

        expect(cryptoService.decrypt).toHaveBeenCalledWith(
          requestDto.data1,
          requestDto.data2,
        );
        expect(result.successful).toBe(true);
        expect(result.data).toEqual(mockDecryptResponse);
      });
    });

    it('should propagate decryption errors', () => {
      const requestDto: DecryptRequestDto = {
        data1: 'invalid-key',
        data2: 'invalid-data',
      };

      const errorMessage = 'Decryption failed: Invalid data format';
      cryptoService.decrypt.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      expect(() => controller.decrypt(requestDto)).toThrow(errorMessage);
      expect(cryptoService.decrypt).toHaveBeenCalledWith(
        'invalid-key',
        'invalid-data',
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should handle encrypt then decrypt roundtrip', () => {
      const originalPayload = 'Original message';
      const encryptDto: EncryptRequestDto = { payload: originalPayload };
      const decryptDto: DecryptRequestDto = {
        data1: mockEncryptResponse.data1,
        data2: mockEncryptResponse.data2,
      };

      cryptoService.encrypt.mockReturnValue(mockEncryptResponse);
      cryptoService.decrypt.mockReturnValue({
        payload: originalPayload,
      });

      const encryptResult = controller.encrypt(encryptDto);
      const decryptResult = controller.decrypt(decryptDto);

      expect(encryptResult.successful).toBe(true);
      expect(decryptResult.successful).toBe(true);
      expect(decryptResult.data?.payload).toBe(originalPayload);
    });
  });
});
