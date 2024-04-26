import { NostrEvent, SimplePool } from "nostr-tools";
import { BOOTSTRAP_RELAYS, CACHE_RELAY } from "./env.js";
import { DNSRecordFields } from "hbo-dnsd";
import { logger } from "./logger.js";

export const PUBKEY_RECORD_KIND = 10053;

const log = logger.extend("nostr");
export const pool = new SimplePool();

const refresh = new Set<string>();

export async function refreshRecords() {
  if (!CACHE_RELAY || refresh.size === 0) return;

  const filter = {
    kinds: [PUBKEY_RECORD_KIND],
    authors: Array.from(refresh),
  };

  refresh.clear();

  log(`Refreshing ${filter.authors.length} 10053 records`);
  const sub = pool.subscribeMany(BOOTSTRAP_RELAYS, [filter], {
    onevent(event) {
      pool.publish([CACHE_RELAY!], event);
    },
    oneose() {
      sub.close();
    },
  });
}

export async function findPubkeyRecord(pubkey: string) {
  const filter = {
    kinds: [PUBKEY_RECORD_KIND],
    authors: [pubkey],
  };

  if (CACHE_RELAY) {
    const cached = await pool.get([CACHE_RELAY], filter);
    if (cached) {
      refresh.add(pubkey);
      return cached;
    }
  }

  log("Looking for kind 10053 record for", pubkey);
  const event = await pool.get(BOOTSTRAP_RELAYS, filter);

  if (event) {
    log("Found event", event.id);
    if (CACHE_RELAY) pool.publish([CACHE_RELAY], event);
  }

  return event;
}

const randomTTL = () => Math.floor(Math.random() * 3600);
export function getRecordsFromEvent(
  event: NostrEvent,
  hostname: string,
  type?: string,
) {
  const tags = event.tags.filter((t) => t[0] === type);

  return tags.map(
    (tag) =>
      ({
        name: hostname,
        type: tag[0],
        data: tag[1],
        ttl: tag[2] ? parseInt(tag[2]) || randomTTL() : randomTTL(),
      }) satisfies DNSRecordFields,
  );
}
