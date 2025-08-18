"use client";

import { useState } from "react";
import { Chess } from "chess.js";
import { createRoom, joinRoom } from "../lib/chessRooms";

type Props = {
  onClose: () => void;
  onSubscribed: (code: string) => void; // parent will subscribe
  deviceId: string;
  setEngineSide: (side: "w" | "b" | null) => void;
};

export function RoomModal({
  onClose,
  onSubscribed,
  deviceId,
  setEngineSide,
}: Props) {
  const [substep, setSubstep] = useState<"choice" | "create" | "join">(
    "choice"
  );
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="chess-modal">
      <div className="chess-modal-title">Room</div>
      {substep === "choice" && (
        <>
          <div className="chess-modal-buttons">
            <button
              className="clickable btn btn--lg"
              onClick={() => {
                setError("");
                setSubstep("create");
              }}
            >
              Create
            </button>
            <button
              className="clickable btn btn--lg"
              onClick={() => {
                setError("");
                setJoinCode("");
                setSubstep("join");
              }}
            >
              Join
            </button>
          </div>
          <div style={{ marginTop: 14 }}>
            <button
              className="clickable btn btn--md"
              onClick={onClose}
              style={{ opacity: 0.85 }}
            >
              Back
            </button>
          </div>
        </>
      )}
      {substep === "create" && (
        <>
          <div className="chess-modal-title">Choose side</div>
          <div className="chess-modal-buttons">
            <button
              className="clickable btn btn--lg"
              onClick={() => void handleCreate("w")}
            >
              White
            </button>
            <button
              className="clickable btn btn--lg"
              onClick={() => void handleCreate("b")}
            >
              Black
            </button>
          </div>
          {error && (
            <div style={{ marginTop: 10, color: "#ff6b6b" }}>{error}</div>
          )}
          <div style={{ marginTop: 14 }}>
            <button
              className="clickable btn btn--md"
              onClick={() => setSubstep("choice")}
              style={{ opacity: 0.85 }}
            >
              Back
            </button>
          </div>
        </>
      )}
      {substep === "join" && (
        <>
          <div className="chess-modal-title">Enter room code</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleJoin();
                }
              }}
              placeholder="ABC123"
              className="room-code-input"
            />
            <button
              className="clickable btn btn--lg"
              onClick={() => void handleJoin()}
            >
              Join
            </button>
          </div>
          {error && (
            <div style={{ marginTop: 10, color: "#ff6b6b" }}>{error}</div>
          )}
          <div style={{ marginTop: 14 }}>
            <button
              className="clickable btn btn--md"
              onClick={() => setSubstep("choice")}
              style={{ opacity: 0.85 }}
            >
              Back
            </button>
          </div>
        </>
      )}
    </div>
  );

  async function handleCreate(side: "w" | "b") {
    setError("");
    try {
      setEngineSide(side === "b" ? "w" : null);
      const code = (
        Math.random().toString(36).slice(2, 8) +
        Math.random().toString(36).slice(2, 8)
      )
        .toUpperCase()
        .slice(0, 6);
      const startFen = new Chess().fen();
      const myNick =
        typeof window !== "undefined"
          ? localStorage.getItem("terminal_nickname")
          : null;
      await createRoom(code, deviceId, side, startFen, myNick);
      onSubscribed(code);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create room";
      setError(msg);
    }
  }

  async function handleJoin() {
    const code = (joinCode || "").trim().toUpperCase();
    if (!code) {
      setError("Enter a code");
      return;
    }
    try {
      setEngineSide(null);
      const myNick =
        typeof window !== "undefined"
          ? localStorage.getItem("terminal_nickname")
          : null;
      await joinRoom(code, deviceId, myNick);
      onSubscribed(code);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to join room";
      setError(msg);
    }
  }
}
