import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { EncryptRequestDto } from './dto/encrypt-request.dto';
import { DecryptRequestDto } from './dto/decrypt-request.dto';
import { BaseResponse } from '../common/response/base-response';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EncryptResponseData } from './dto/encrypt-response.dto';
import { DecryptResponseData } from './dto/decrypt-response.dto';

@ApiTags('crypto')
@Controller()
export class CryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  @Post('/get-encrypt-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Encrypt payload with RSA + AES-GCM' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Encrypted data returned successfully',
    type: EncryptResponseData,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request - payload is empty or exceeds 2000 characters',
  })
  encrypt(@Body() body: EncryptRequestDto) {
    const result = this.cryptoService.encrypt(body.payload);
    return BaseResponse.success<EncryptResponseData>(result);
  }

  @Post('/get-decrypt-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decrypt payload with RSA + AES-GCM' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Decrypted data returned successfully',
    type: DecryptResponseData,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request - data1 or data2 is empty or invalid',
  })
  decrypt(@Body() body: DecryptRequestDto) {
    const result = this.cryptoService.decrypt(body.data1, body.data2);
    return BaseResponse.success<DecryptResponseData>(result);
  }
}
