import { ApiProperty } from '@nestjs/swagger';

export class DecryptResponseData {
  @ApiProperty({
    description: 'Decrypted payload',
    example: 'original message',
  })
  payload: string;
}
