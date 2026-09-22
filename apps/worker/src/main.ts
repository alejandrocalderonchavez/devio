import type { ApiHealth } from "@devio/types";

const health: ApiHealth = {
  service: "devio-worker",
  status: "ok",
  timestamp: new Date().toISOString(),
};

console.log(JSON.stringify(health));
console.log("Devio worker listo para recibir colas de PDFs, notificaciones y migración.");

