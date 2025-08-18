/**
 * Chess utility helpers: board parsing, coordinate transforms, and piece asset map.
 * Centralized here to avoid duplication across components.
 */

/** Parse a FEN string into a 2D matrix of piece codes like "wp", "bk", or "" for empty. */
export function fromFen(fen: string): string[][] {
  const [placement] = fen.split(" ");
  const rows = placement.split("/");
  return rows.map((row) => {
    const out: string[] = [];
    for (const ch of row) {
      if (/\d/.test(ch)) {
        out.push(...Array(parseInt(ch, 10)).fill(""));
      } else {
        const color = ch === ch.toLowerCase() ? "b" : "w";
        const piece = ch.toLowerCase();
        const code = color + pieceMap[piece as keyof typeof pieceMap];
        out.push(code);
      }
    }
    return out;
  });
}

/** Map shorthand piece letters to canonical names. */
const pieceMap = {
  p: "p",
  r: "r",
  n: "n",
  b: "b",
  q: "q",
  k: "k",
} as const;

/** Return a map of piece codes (e.g., "wp") to SVG asset paths. */
export function createPieceMap(): Record<string, string> {
  return {
    wp: "/chess/white_pawn.svg",
    wr: "/chess/white_rook.svg",
    wb: "/chess/white_bishop.svg",
    wn: "/chess/white_knight.svg",
    wq: "/chess/white_queen.svg",
    wk: "/chess/white_king.svg",
    bp: "/chess/black_pawn.svg",
    br: "/chess/black_rook.svg",
    bb: "/chess/black_bishop.svg",
    bn: "/chess/black_knight.svg",
    bq: "/chess/black_queen.svg",
    bk: "/chess/black_king.svg",
  };
}

/** Convert 0-based matrix coords to algebraic (e.g., 0,0 -> a8). */
export function toCoord(r: number, c: number): string {
  const file = String.fromCharCode("a".charCodeAt(0) + c);
  const rank = 8 - r;
  return `${file}${rank}`;
}

/** Convert algebraic like "e2" to 0-based matrix coords. */
export function fromCoord(coord: string): { r: number; c: number } {
  const file = coord.charCodeAt(0) - "a".charCodeAt(0);
  const rank = parseInt(coord[1], 10);
  const r = 8 - rank;
  const c = file;
  return { r, c };
}
