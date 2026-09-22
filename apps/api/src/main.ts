import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: true, // Allow Vercel preview URLs, production domains and local development
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
  });
  
  app.setGlobalPrefix("v1");
  
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
}

void bootstrap();

