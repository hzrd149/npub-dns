import dnsd from "hbo-dnsd";
import WebSocket from "ws";
import { nip19, useWebSocketImplementation, SimplePool } from "nostr-tools";
import debug from "debug";

const log = debug("dns");

global.WebSocket = WebSocket;
useWebSocketImplementation(WebSocket);

const RELAYS = ["wss://nostrue.com/", "wss://nos.lol/", "wss://nostr.wine/"];

const randomTTL = () => Math.floor(Math.random() * 3600);
const pool = new SimplePool();

const server = dnsd
  .createServer(async (req, res) => {
    const question = res.question[0];
    const hostname = question.name;

    let pubkey = hostname.match(/[0-9a-f]{64}|npub1[0-9a-z]{58}/i)?.[0] ?? "";

    // convert pubkey to hex
    if (pubkey.startsWith("npub1")) {
      pubkey = nip19.decode(pubkey).data;
    }

    if (pubkey) {
      log("Looking for 10053 event by", pubkey);
      const event = await pool.get(RELAYS, {
        kinds: [10053],
        authors: [pubkey],
      });
      if (!event) return req.end();

      log("Found nostr event", event.id);
      const records = event.tags.filter((t) => t[0] === question.type);

      for (const record of records) {
        res.answer.push({
          name: hostname,
          type: record[0],
          data: record[1],
          ttl: record[2] ? parseInt(record[2]) || randomTTL() : randomTTL(),
        });
      }
    }

    res.end();
  })
  .listen(10053, "127.0.0.1", () => {
    log("Server running at 127.0.0.1:10053");
  });

function shutdown() {
  log("Shutting down server");
  server.close();
  process.exit();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
