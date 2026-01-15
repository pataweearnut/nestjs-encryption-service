import { ApiProperty } from '@nestjs/swagger';

export class EncryptResponseData {
  @ApiProperty({
    description: 'Encrypted AES key with private key',
    example: 'base64EncodedString...',
  })
  data1: string;

  @ApiProperty({
    description: 'Encrypted payload with AES key',
    example: 'base64EncodedString...',
  })
  data2: string;
}
