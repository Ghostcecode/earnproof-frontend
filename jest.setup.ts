import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "node:util";

// jsdom doesn't implement TextEncoder/TextDecoder; Node's util module does.
// Needed by anything that pulls in lib/validation/qr-payload.ts (byte-length
// checks on proof IDs), directly or transitively.
if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
}
if (typeof globalThis.TextDecoder === "undefined") {
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}
