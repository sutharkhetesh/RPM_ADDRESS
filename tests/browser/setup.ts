import { createTestDatabase } from "../database-setup";
import { spawn } from "node:child_process";
export default async function setup() {
  const db = await createTestDatabase();
  const app = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3107",
    ],
    {
      env: {
        ...process.env,
        DATABASE_URL: db.url,
      },
      stdio: "pipe",
    },
  );
  let output = "";
  app.stdout.on("data", (chunk) => (output += chunk));
  app.stderr.on("data", (chunk) => (output += chunk));
  try {
    let ready = false;
    for (let i = 0; i < 120; i++) {
      if (app.exitCode !== null)
        throw new Error(`Test server exited: ${output}`);
      try {
        const r = await fetch("http://127.0.0.1:3107/login");
        if (r.ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 250));
    }
    if (!ready) throw new Error(`Test server did not start: ${output}`);
  } catch (e) {
    app.kill();
    await db.dispose();
    throw e;
  }
  return async () => {
    app.kill();
    await new Promise<void>((r) => app.once("exit", () => r()));
    await db.dispose();
  };
}
