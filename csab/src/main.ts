import { NestFactory } from '@nestjs/core';
// import * as helmet from 'helmet';
import { AppModule } from './app.module';
import config from './platform/cs/services/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.use(helmet());
  app.enableCors({
    origin: config.get('cors.origin'),
    credentials: true,
    // exposedHeaders: [GEOIP_HEADER],
  });
  await app.listen(8080);
}
bootstrap();
