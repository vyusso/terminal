// Classic worker: load stockfish script and create an engine instance with explicit WASM path
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
self.importScripts(
  "https://cdn.jsdelivr.net/npm/stockfish@10.0.2/src/stockfish.js"
);

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
type Engine = {
  onmessage: (e: MessageEvent | string) => void;
  postMessage: (cmd: string) => void;
};
type SelfWithStockfish = { STOCKFISH: (p?: string) => Engine };
const engine = (self as unknown as SelfWithStockfish).STOCKFISH(
  "https://cdn.jsdelivr.net/npm/stockfish@10.0.2/src/stockfish.wasm"
);

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
engine.onmessage = (event: MessageEvent | string) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  postMessage(typeof event === "string" ? event : event?.data ?? event);
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
self.onmessage = (e: MessageEvent) => {
  const msg = e.data;
  if (typeof msg === "string") {
    engine.postMessage(msg);
  } else if (msg && typeof msg.cmd === "string") {
    engine.postMessage(msg.cmd);
  }
};
