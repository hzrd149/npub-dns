#!/bin/env node
import dnsd from "hbo-dnsd";
import WebSocket from "ws";
import { nip19, useWebSocketImplementation } from "nostr-tools";
import { logger } from "./logger.js";
import { findPubkeyRecord, getRecordsFromEvent } from "./nostr.js";
import { HOST, PORT } from "./env.js";

// @ts-expect-error
global.WebSocket = WebSocket;
useWebSocketImplementation(WebSocket);

const server = dnsd
  .createServer(async (req, res) => {
    const question = req.question[0];
    const hostname = question.name;

    // make sure the domain ends with a nostr extension
    if (!hostname.endsWith(".str") && !hostname.endsWith(".nostr"))
      return res.end();

    let pubkey = hostname.match(/[0-9a-f]{64}|npub1[0-9a-z]{58}/i)?.[0] ?? "";

    // convert pubkey to hex
    if (pubkey.startsWith("npub1")) {
      const decode = nip19.decode(pubkey);
      if (decode.type === "npub") pubkey = decode.data;
    }

    if (pubkey) {
      const event = await findPubkeyRecord(pubkey);
      if (!event) return res.end();

      res.answer = getRecordsFromEvent(event, hostname, question.type);
    }

    res.end();
  })
  .listen(PORT, HOST, () => {
    logger(`Server running at ${HOST}:${PORT}`);
  });

function shutdown() {
  logger("Shutting down server");
  server.close();
  process.exit();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
