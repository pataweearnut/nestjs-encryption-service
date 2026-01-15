import { IsString, IsNotEmpty, IsBase64 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DecryptRequestDto {
  @ApiProperty({
    description: 'Encrypted AES key with private key (from encrypt response data1)',
    example: 'base64EncodedString...',
  })
  @IsString({ message: 'data1 must be a string' })
  @IsNotEmpty({ message: 'data1 is required' })
  @IsBase64({}, { message: 'data1 must be a valid base64 string' })
  data1: string;

  @ApiProperty({
    description: 'Encrypted payload with AES key (from encrypt response data2)',
    example: 'base64EncodedString...',
  })
  @IsString({ message: 'data2 must be a string' })
  @IsNotEmpty({ message: 'data2 is required' })
  @IsBase64({}, { message: 'data2 must be a valid base64 string' })
  data2: string;
}
