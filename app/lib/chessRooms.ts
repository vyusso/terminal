import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  increment,
  type Unsubscribe,
  type DocumentReference,
  type WithFieldValue,
  type UpdateData,
  type FieldValue,
  type Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export type RoomDoc = {
  fen: string;
  turn: "w" | "b";
  players: { white: string | null; black: string | null };
  playerNicknames?: { white: string | null; black: string | null };
  host: string;
  status: "waiting" | "active" | "finished";
  lastMove: { from: string; to: string; promotion?: string } | null;
  version: number;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
};

export function generateRoomCode(length: number = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function createRoom(
  code: string,
  hostId: string,
  youPlay: "w" | "b",
  startFen: string,
  hostNickname: string | null
) {
  const ref: DocumentReference<RoomDoc> = doc(
    db,
    "chess_rooms",
    code
  ) as DocumentReference<RoomDoc>;
  const snap = await getDoc(ref);
  if (snap.exists()) throw new Error("Room code already exists");
  const players: RoomDoc["players"] = {
    white: youPlay === "w" ? hostId : null,
    black: youPlay === "b" ? hostId : null,
  };
  const data: WithFieldValue<RoomDoc> = {
    fen: startFen,
    turn: "w",
    players,
    playerNicknames: {
      white: youPlay === "w" ? hostNickname ?? null : null,
      black: youPlay === "b" ? hostNickname ?? null : null,
    },
    host: hostId,
    status: "waiting",
    lastMove: null,
    version: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  return ref;
}

export async function joinRoom(
  code: string,
  joinerId: string,
  joinerNickname: string | null
) {
  const ref: DocumentReference<RoomDoc> = doc(
    db,
    "chess_rooms",
    code
  ) as DocumentReference<RoomDoc>;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Room not found");
    const data = snap.data() as RoomDoc;
    if (data.status === "finished") throw new Error("Room finished");
    const players = { ...data.players };
    const playerNicknames = {
      ...(data.playerNicknames || { white: null, black: null }),
    } as RoomDoc["playerNicknames"];
    if (!players.white) players.white = joinerId;
    else if (!players.black) players.black = joinerId;
    else throw new Error("Room full");
    if (players.white === joinerId)
      playerNicknames!.white = joinerNickname ?? null;
    if (players.black === joinerId)
      playerNicknames!.black = joinerNickname ?? null;
    const status: RoomDoc["status"] =
      players.white && players.black ? "active" : "waiting";
    tx.update(ref, {
      players,
      playerNicknames,
      status,
      updatedAt: serverTimestamp(),
    } as UpdateData<RoomDoc>);
  });
  return ref;
}

export function subscribeRoom(
  code: string,
  onChange: (room: RoomDoc | null) => void
): Unsubscribe {
  const ref: DocumentReference<RoomDoc> = doc(
    db,
    "chess_rooms",
    code
  ) as DocumentReference<RoomDoc>;
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) onChange(snap.data() as RoomDoc);
    else onChange(null);
  });
}

export async function submitMove(
  code: string,
  move: { from: string; to: string; promotion?: string },
  expectVersion: number,
  nextFen: string,
  nextTurn: "w" | "b"
) {
  const ref: DocumentReference<RoomDoc> = doc(
    db,
    "chess_rooms",
    code
  ) as DocumentReference<RoomDoc>;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Room not found");
    const data = snap.data() as RoomDoc;
    if (data.version !== expectVersion) throw new Error("Stale state");
    tx.update(ref, {
      fen: nextFen,
      turn: nextTurn,
      lastMove: move,
      version: increment(1),
      updatedAt: serverTimestamp(),
    } as UpdateData<RoomDoc>);
  });
}

export async function leaveRoom(code: string): Promise<void> {
  const ref: DocumentReference<RoomDoc> = doc(
    db,
    "chess_rooms",
    code
  ) as DocumentReference<RoomDoc>;
  try {
    await deleteDoc(ref);
  } catch {}
}
