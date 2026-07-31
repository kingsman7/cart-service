import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Cart Service corriendo en: http://localhost:${port}`);
}
bootstrap();