import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableCors({
    origin: [
      'http://localhost:15000',
      'http://localhost:19000',
    ],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 18090);
}
bootstrap();
