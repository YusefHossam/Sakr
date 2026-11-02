// Runs the e2e suite against the deployed site: npm run test:live [url]
// The deployment must be public (Vercel Authentication off), otherwise every page asks for a Vercel login.
import { spawnSync } from "node:child_process";

const url = process.argv[2] ?? "https://sakr-store.vercel.app";
const probe = await fetch(url, { redirect: "manual" }).catch(() => null);
if (!probe || probe.status >= 300) {
  console.error(`${url} answered ${probe?.status ?? "nothing"}: it is not public yet.`);
  console.error("Turn off Vercel Authentication first: npm run unlock  (or Project > Settings > Deployment Protection).");
  process.exit(1);
}
const r = spawnSync("npx", ["playwright", "test", "--project=desktop", ...process.argv.slice(3)], { stdio: "inherit", shell: true, env: { ...process.env, BASE_URL: url } });
process.exit(r.status ?? 1);
