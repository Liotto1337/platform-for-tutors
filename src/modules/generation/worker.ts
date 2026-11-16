import "dotenv/config";
import { setTimeout } from "node:timers/promises";
import { db } from "@/lib/db";
import { runNextJob } from "./queue";

let stopping = false;
process.on("SIGTERM", () => { stopping = true; });
process.on("SIGINT", () => { stopping = true; });

console.log("Обработчик заданий запущен.");
while (!stopping) {
  try {
    if (!(await runNextJob())) await setTimeout(1000);
  } catch {
    console.error("Очередь временно недоступна.");
    await setTimeout(3000);
  }
}
await db.$disconnect();
