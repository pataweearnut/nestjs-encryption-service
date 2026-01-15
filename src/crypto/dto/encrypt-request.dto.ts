import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EncryptRequestDto {
  @ApiProperty({
    description: 'Plain text payload to encrypt',
    example: 'Hello World',
    maxLength: 2000,
  })
  @IsString()
  @Length(0, 2000)
  payload: string;
}
