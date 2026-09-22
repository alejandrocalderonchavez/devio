import { Injectable } from "@nestjs/common";
import type { ApiHealth } from "@devio/types";

@Injectable()
export class AppService {
  getHealth(): ApiHealth {
    return {
      service: "devio-api",
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }
}

