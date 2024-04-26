import "dotenv/config.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 10053;
const HOST = process.env.HOST || "127.0.0.1";
const CACHE_RELAY = process.env.CACHE_RELAY;
const BOOTSTRAP_RELAYS = process.env.BOOTSTRAP_RELAYS?.split(",") ?? [];

if (BOOTSTRAP_RELAYS.length === 0)
  throw new Error("At least one bootstrap relay needs to be set");

export { CACHE_RELAY, BOOTSTRAP_RELAYS, PORT, HOST };
