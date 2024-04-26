import debug from "debug";

if (!process.env.DEBUG) debug.enable("dns,dns:*");

export const logger = debug("dns");
