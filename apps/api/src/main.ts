import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.WEB_URL ?? "http://localhost:3000" });
  app.setGlobalPrefix("v1");
  await app.listen(Number(process.env.PORT ?? 4000));
}

void bootstrap();

