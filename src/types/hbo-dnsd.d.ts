// Types for https://github.com/hbouvier/dnsd
// NOTE: these are incomplete

declare module "hbo-dnsd" {
  import net from "net";
  import dgram from "dgram";
  import type EventEmitter from "events";

  type EventMap = {
    request: [Request, Response];
    error: [Error];
    listening: [];
    close: [];
  };
  class Server extends EventEmitter<EventMap> {
    tcp: net.Server;
    udp: dgram.Socket;

    constructor(handler?: Handler): this;

    listen(port: number, ip?: string, listeningListener?: () => void): this;
    close(): void;
    ref(): void;
    unref(): void;
  }

  type Handler = (req: Request, res: Response) => any;

  interface DNSRecordFields {
    name: string;
    type: string;
    class?: string;
    ttl?: number;
    data?: string | null;
  }
  interface DNSRecord extends DNSRecordFields {
    kind(): "EDNS" | string;
    toString(): string;
  }

  class Message {
    id: number;
    type: "request" | "response";

    toString(): string;
    toJSON(): Record<string, number | string>;
    toBinary(): Buffer;
  }

  class Request extends Message {
    question: DNSRecord[];

    constructor(data: Buffer, connection: net.Socket | dgram.Socket): this;
  }
  class Response extends Message {
    answer: (DNSRecordFields | DNSRecord)[];

    constructor(data: Buffer, connection: net.Socket | dgram.Socket): this;

    end(value?: string): void;
  }

  export function createServer(handler?: Handler): Server;
}
