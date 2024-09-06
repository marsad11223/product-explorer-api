// nest imports
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

// project imports
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes(new ValidationPipe());
  const PORT = Number(process.env.PORT) || 3000;
  console.log('port=', process.env.PORT);
  await app.listen(PORT);
}
bootstrap();
