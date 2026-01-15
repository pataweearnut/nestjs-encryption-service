import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createValidationPipe } from './common/pipes/validation.pipe';
import { AllExceptionFilter } from './common/filters/exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    app.enableCors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    });

    // Filter
    app.useGlobalFilters(new AllExceptionFilter());

    // Pipe
    app.useGlobalPipes(createValidationPipe());

    // Swagger configuration
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Crypto API')
      .setDescription('Encrypt / Decrypt Service')
      .setVersion('1.0')
      .addTag('crypto')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api-docs', app, document);

    const configService = app.get(ConfigService);
    const port = configService.get<number>('NODE_PORT') || 3000;
    const host = configService.get<string>('NODE_CONNECTION') || '127.0.0.1';

    await app.listen(port, host);
    
    logger.log(`Application is running on: http://${host}:${port}`);
    logger.log(`Swagger documentation: http://${host}:${port}/api-docs`);
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

bootstrap();
