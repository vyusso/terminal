"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square, type Move } from "chess.js";
import {
  createRoom,
  joinRoom,
  subscribeRoom,
  submitMove,
  generateRoomCode,
  type RoomDoc,
} from "../lib/chessRooms";
import { getOrCreateDeviceId } from "../utils/device";

type Color = "white" | "black";

interface ChessWindowProps {
  onClose: () => void;
}

export default function ChessWindow({ onClose }: ChessWindowProps) {
  const gameRef = useRef<Chess>(new Chess());
  const [board, setBoard] = useState<string[][]>(() =>
    fromFen(gameRef.current.fen())
  );
  const [turn, setTurn] = useState<Color>("white");
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(
    null
  );
  const [legalTargets, setLegalTargets] = useState<Square[]>([]);
  const [gameOverText, setGameOverText] = useState<string | null>(null);
  const [boardSize, setBoardSize] = useState<number>(400);
  const [lastMove, setLastMove] = useState<{
    from: { r: number; c: number } | null;
    to: { r: number; c: number } | null;
  }>({ from: null, to: null });
  // Setup modal state: 'choose' (Bot or Room), 'bot' (difficulty), 'color' (pick side), 'room' (Create/Join), 'none' (hidden)
  const [showSetup, setShowSetup] = useState<
    "choose" | "bot" | "color" | "room" | "none"
  >("choose");

  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Worker | null>(null);
  const [botLevel, setBotLevel] = useState<number | null>(null);
  const [engineReady, setEngineReady] = useState<boolean>(false);
  const engineGoStartRef = useRef<number>(0);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [thinkingDots, setThinkingDots] = useState<number>(0);
  const [opponent, setOpponent] = useState<string>("-");
  const [engineSide, setEngineSide] = useState<"w" | "b" | null>(null);
  const audioPoolRef = useRef<HTMLAudioElement[]>([]);
  const nextAudioIndexRef = useRef<number>(0);
  const audioUnlockedRef = useRef<boolean>(false);
  // Room state
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomVersion, setRoomVersion] = useState<number>(0);
  const [roomStatus, setRoomStatus] = useState<
    "none" | "waiting" | "active" | "finished"
  >("none");
  const [mySide, setMySide] = useState<"w" | "b" | null>(null);
  const roomUnsubRef = useRef<null | (() => void)>(null);
  const deviceIdRef = useRef<string>("");
  const roomCodeRef = useRef<string | null>(null);
  useEffect(() => {
    deviceIdRef.current = getOrCreateDeviceId();
  }, []);
  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  async function updateOpponentFromRoom(room: RoomDoc) {
    const myId = deviceIdRef.current;
    // Prefer names stored in room doc for instant display
    const nicks = room.playerNicknames || { white: null, black: null };
    const otherNick =
      room.players.white === myId
        ? nicks.black
        : room.players.black === myId
        ? nicks.white
        : null;
    if (otherNick && otherNick.trim()) {
      setOpponent(`vs - ${otherNick}`);
      return;
    }
    const otherId =
      room.players.white === myId
        ? room.players.black
        : room.players.black === myId
        ? room.players.white
        : null;
    if (!otherId) {
      setOpponent(room.status === "active" ? "vs - Online" : "vs - Waiting...");
      return;
    }
    try {
      const resp = await fetch("/api/get-nickname", {
        headers: { "x-device-id": otherId },
      });
      const data = await resp.json();
      const nick: string | null = data?.nickname ?? null;
      setOpponent(`vs - ${nick && nick.trim() ? nick : "Online"}`);
    } catch {
      setOpponent("vs - Online");
    }
  }

  // Responsive sizing for mobile/desktop
  useEffect(() => {
    const compute = () => {
      const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
      const vh =
        typeof window !== "undefined"
          ? window.visualViewport?.height ?? window.innerHeight
          : 768;
      // Fit board within viewport while keeping margins
      const maxBoard = 400;
      const minBoard = 240;
      const available = Math.min(vw - 32, vh - 160);
      const next = Math.max(minBoard, Math.min(maxBoard, available));
      setBoardSize(next);
    };
    compute();
    window.addEventListener("resize", compute);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("resize", compute);
      vv?.removeEventListener("resize", compute);
    };
  }, []);

  const pieceToSvg = useMemo(() => createPieceMap(), []);

  // Prepare a small audio pool and unlock on first interaction (mobile-friendly)
  useEffect(() => {
    const pool: HTMLAudioElement[] = [];
    for (let i = 0; i < 3; i += 1) {
      const a = new Audio("/audio/chessmove.mp3");
      a.preload = "auto";
      try {
        a.load();
      } catch {}
      pool.push(a);
    }
    audioPoolRef.current = pool;

    const unlock = async () => {
      if (audioUnlockedRef.current) return;
      audioUnlockedRef.current = true;
      for (const a of audioPoolRef.current) {
        try {
          await a.play();
          a.pause();
          a.currentTime = 0;
        } catch {}
      }
    };

    const el = containerRef.current;
    const pointerDownHandler = () => void unlock();
    el?.addEventListener("pointerdown", pointerDownHandler);
    const keyHandler = () => void unlock();
    document.addEventListener("keydown", keyHandler, { once: true });
    return () => {
      el?.removeEventListener("pointerdown", pointerDownHandler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, []);

  const playMoveSound = () => {
    const pool = audioPoolRef.current;
    if (!pool || pool.length === 0) return;
    const index = nextAudioIndexRef.current % pool.length;
    nextAudioIndexRef.current = (index + 1) % pool.length;
    const a = pool[index];
    try {
      a.currentTime = 0;
      void a.play();
    } catch {}
  };

  // Animate thinking dots while engine is thinking
  useEffect(() => {
    if (!isThinking) return;
    setThinkingDots(0);
    const id = setInterval(() => {
      setThinkingDots((d) => (d + 1) % 4);
    }, 400);
    return () => clearInterval(id);
  }, [isThinking]);

  useEffect(() => {
    if (botLevel && !engineRef.current) {
      const w = new Worker(
        new URL("../workers/stockfish.worker.ts", import.meta.url)
      );
      engineRef.current = w;
      setEngineReady(false);
      w.onmessage = (e) => {
        const raw: string = (e.data || "").toString();
        if (typeof raw !== "string") return;
        const line = raw.trim();
        if (line === "uciok") {
          w.postMessage("isready");
          return;
        }
        if (
          line === "readyok" ||
          line.startsWith("id ") ||
          line.startsWith("option ")
        ) {
          setEngineReady(true);
          w.postMessage("ucinewgame");
          return;
        }
        if (line.startsWith("bestmove")) {
          const parts = line.split(" ");
          const uci = parts[1];
          if (uci && uci.length >= 4) {
            const from = uci.slice(0, 2) as Square;
            const to = uci.slice(2, 4) as Square;
            const promo = uci.slice(4, 5);
            const applyMove = () => {
              const move = gameRef.current.move({
                from,
                to,
                promotion: (promo as "q" | "r" | "b" | "n") || "q",
              });
              if (move) {
                setBoard(fromFen(gameRef.current.fen()));
                setTurn(gameRef.current.turn() === "w" ? "white" : "black");
                setSelected(null);
                setLegalTargets([]);
                // Track last move squares for highlighting (engine move)
                try {
                  const fromRc = fromCoord(from);
                  const toRc = fromCoord(to);
                  setLastMove({ from: fromRc, to: toRc });
                } catch {}
                updateStatus();
                playMoveSound();
              }
              setIsThinking(false);
            };
            const elapsed =
              typeof performance !== "undefined"
                ? performance.now() - engineGoStartRef.current
                : 0;
            const delay = Math.max(0, 2000 - elapsed);
            setTimeout(applyMove, delay);
          }
          return;
        }
        // Ignore other engine info lines
      };
      // Start UCI handshake
      w.postMessage("uci");
    }
  }, [botLevel]);

  // Update opponent when a bot level is selected or when room mode would set a name
  useEffect(() => {
    if (showSetup === "none" && botLevel) {
      if (botLevel === 1) setOpponent("vs - (Easy - 300–400 ELO)");
      else if (botLevel === 5) setOpponent("vs - (Medium - 800–1200 ELO)");
      else if (botLevel === 12) setOpponent("vs - (Hard - 1600–2000 ELO)");
    }
  }, [showSetup, botLevel]);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        try {
          engineRef.current.terminate();
        } catch {}
        engineRef.current = null;
      }
      if (roomUnsubRef.current) {
        try {
          roomUnsubRef.current();
        } catch {}
        roomUnsubRef.current = null;
      }
      // If in a room, delete it to notify the other player
      const code = roomCodeRef.current;
      if (code) {
        import("../lib/chessRooms").then(({ leaveRoom }) => {
          leaveRoom(code).catch(() => {});
        });
      }
    };
  }, []);

  // Try to delete room on tab close/navigation as well
  useEffect(() => {
    const handleBeforeUnload = () => {
      const code = roomCodeRef.current;
      if (!code) return;
      // Fire-and-forget; may not always complete
      import("../lib/chessRooms").then(({ leaveRoom }) => {
        leaveRoom(code).catch(() => {});
      });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (!botLevel || !engineReady || !engineSide) return;
    const game = gameRef.current;
    if (game.turn() === engineSide && engineRef.current) {
      const w = engineRef.current;
      // Map botLevel to tuned settings
      let skill = 10;
      let maxErr = 0;
      let prob = 0;
      let searchCmd = "go movetime 1500";
      if (botLevel === 1) {
        // Easy ~300–400 Elo
        skill = 0;
        maxErr = 300;
        prob = 90;
        searchCmd = "go depth 1";
      } else if (botLevel === 5) {
        // Medium ~800–1200 Elo
        skill = 4;
        maxErr = 150;
        prob = 50;
        searchCmd = "go depth 3";
      } else if (botLevel === 12) {
        // Hard ~1600–2000 Elo
        skill = 12;
        maxErr = 30;
        prob = 10;
        searchCmd = "go movetime 1500";
      }

      w.postMessage(`setoption name Skill Level value ${skill}`);
      w.postMessage(`setoption name Skill Level Maximum Error value ${maxErr}`);
      w.postMessage(`setoption name Skill Level Probability value ${prob}`);
      w.postMessage(`position fen ${game.fen()}`);
      engineGoStartRef.current =
        typeof performance !== "undefined" ? performance.now() : 0;
      setIsThinking(true);
      w.postMessage(searchCmd);
    }
  }, [board, botLevel, engineReady, engineSide]);

  function handleSquareClick(r: number, c: number) {
    if (gameOverText) return;
    const coord = toCoord(r, c);
    const game = gameRef.current;
    const piece = board[r][c];
    // In room mode, enforce turn & side
    if (roomCode && mySide) {
      const myTurn = (game.turn() as "w" | "b") === mySide;
      const pieceColor = piece ? (piece.startsWith("w") ? "w" : "b") : null;
      if (!myTurn) return;
      if (selected == null && pieceColor !== mySide) return;
    }
    if (selected) {
      const from = toCoord(selected.r, selected.c);
      // If clicking same square: deselect
      if (from === coord) {
        setSelected(null);
        setLegalTargets([]);
        return;
      }
      // If clicking another own piece: switch selection
      const clickedColor = piece ? (piece.startsWith("w") ? "w" : "b") : null;
      if (clickedColor && clickedColor === game.turn()) {
        setSelected({ r, c });
        const moves = game.moves({
          square: coord as Square,
          verbose: true,
        }) as Move[];
        setLegalTargets(moves.map((m) => m.to as Square));
        return;
      }
      // Attempt legal move from selected to clicked square
      const move = game.move({
        from: from as Square,
        to: coord as Square,
        promotion: "q",
      });
      if (move) {
        setBoard(fromFen(game.fen()));
        setTurn(game.turn() === "w" ? "white" : "black");
        // Track last move squares for highlighting (user move)
        const startR = selected.r;
        const startC = selected.c;
        setLastMove({ from: { r: startR, c: startC }, to: { r, c } });
        setSelected(null);
        setLegalTargets([]);
        updateStatus();
        playMoveSound();
        // In room mode, submit move to Firestore and rely on snapshot for authority
        if (roomCode && mySide != null) {
          const nextFen = game.fen();
          const nextTurn = game.turn() as "w" | "b";
          const movePayload = {
            from,
            to: coord as string,
            promotion: "q" as const,
          };
          submitMove(
            roomCode,
            movePayload,
            roomVersion,
            nextFen,
            nextTurn
          ).catch(() => {
            // Ignore; snapshot will correct state on conflict
          });
        }
      } else {
        // Illegal target: keep current selection, do nothing
      }
    } else {
      if (!piece) return;
      const color = piece.startsWith("w") ? "w" : "b";
      if (color !== game.turn()) return;
      setSelected({ r, c });
      // compute legal moves for highlighting
      const moves = game.moves({
        square: coord as Square,
        verbose: true,
      }) as Move[];
      setLegalTargets(moves.map((m) => m.to as Square));
    }
  }

  function updateStatus() {
    const game = gameRef.current;
    if (game.isCheckmate()) {
      const loser = game.turn() === "w" ? "white" : "black";
      const winner = loser === "white" ? "black" : "white";
      setGameOverText(`${winner} wins by checkmate`);
      return;
    }
    if (game.isStalemate()) {
      setGameOverText("Draw by stalemate");
      return;
    }
    if (game.isInsufficientMaterial()) {
      setGameOverText("Draw by insufficient material");
      return;
    }
    if (game.isThreefoldRepetition()) {
      setGameOverText("Draw by threefold repetition");
      return;
    }
    if (game.isDraw()) {
      setGameOverText("Draw");
    }
  }

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="chess-window"
      style={{ width: boardSize + 20 }}
    >
      <div className="chess-header" style={{ gap: 8 }}>
        <div>
          <div>chess.exe</div>
          {roomCode && (
            <div style={{ color: "#eee" }}>
              Room: <b>{roomCode}</b>{" "}
              <span style={{ opacity: 0.8 }}>({roomStatus})</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              minWidth: "12ch",
              textAlign: "right",
              color: "#ff6b35",
              textShadow: "none",
              animation: "none",
            }}
          >
            {isThinking ? `thinking${".".repeat(thinkingDots)}` : "\u00A0"}
          </div>
          <button
            onClick={() => {
              const code = roomCodeRef.current;
              if (code) {
                import("../lib/chessRooms").then(({ leaveRoom }) => {
                  leaveRoom(code).catch(() => {});
                });
              }
              onClose();
            }}
            className="clickable btn btn--sm"
          >
            Close
          </button>
        </div>
      </div>

      {/* Setup modal overlay */}
      {showSetup !== "none" && (
        <div className="chess-modal-overlay" style={{ pointerEvents: "auto" }}>
          <div className="chess-modal">
            {showSetup === "choose" && (
              <>
                <div className="chess-modal-title">Select mode</div>
                <div className="chess-modal-buttons">
                  <button
                    className="clickable btn btn--lg"
                    onClick={() => setShowSetup("bot")}
                  >
                    Bot
                  </button>
                  <button
                    className="clickable btn btn--lg"
                    onClick={() => setShowSetup("room")}
                  >
                    Room
                  </button>
                </div>
              </>
            )}
            {showSetup === "bot" && (
              <>
                <div className="chess-modal-title">Bot</div>
                <div className="chess-modal-buttons">
                  <button
                    className="clickable btn btn--lg"
                    onClick={() => {
                      setBotLevel(1);
                      setShowSetup("color");
                    }}
                  >
                    Easy
                  </button>
                  <button
                    className="clickable btn btn--lg"
                    onClick={() => {
                      setBotLevel(5);
                      setShowSetup("color");
                    }}
                  >
                    Medium
                  </button>
                  <button
                    className="clickable btn btn--lg"
                    onClick={() => {
                      setBotLevel(12);
                      setShowSetup("color");
                    }}
                  >
                    Hard
                  </button>
                </div>
                <div style={{ marginTop: 14 }}>
                  <button
                    className="clickable btn btn--md"
                    style={{ opacity: 0.85 }}
                    onClick={() => setShowSetup("choose")}
                  >
                    Back
                  </button>
                </div>
              </>
            )}
            {showSetup === "color" && (
              <>
                <div className="chess-modal-title">Choose color</div>
                <div className="chess-modal-buttons">
                  <button
                    className="clickable btn btn--lg"
                    onClick={() => {
                      setEngineSide("b"); // you play white
                      setShowSetup("none");
                    }}
                  >
                    White
                  </button>
                  <button
                    className="clickable btn btn--lg"
                    onClick={() => {
                      setEngineSide("w"); // you play black
                      setShowSetup("none");
                    }}
                  >
                    Black
                  </button>
                  <button
                    className="clickable btn btn--lg"
                    onClick={() => {
                      const youWhite = Math.random() < 0.5;
                      setEngineSide(youWhite ? "b" : "w");
                      setShowSetup("none");
                    }}
                  >
                    Random
                  </button>
                </div>
                <div style={{ marginTop: 14 }}>
                  <button
                    className="clickable btn btn--md"
                    style={{ opacity: 0.85 }}
                    onClick={() => setShowSetup("bot")}
                  >
                    Back
                  </button>
                </div>
              </>
            )}
            {showSetup === "room" && (
              <>
                <div className="chess-modal-title">Room</div>
                <div className="chess-modal-buttons">
                  <button
                    className="clickable btn btn--lg"
                    onClick={() => {
                      // Create room: ask side, generate code, create doc, subscribe
                      try {
                        const side = (
                          window.prompt("Choose side: w or b", "w") || "w"
                        ).toLowerCase();
                        const youPlay = side === "b" ? "b" : "w";
                        const code = generateRoomCode();
                        // Disable engine in room mode
                        setBotLevel(null);
                        setEngineSide(youPlay === "b" ? "w" : null); // flip board if black
                        const startFen = new Chess().fen();
                        const myNick =
                          localStorage.getItem("terminal_nickname");
                        createRoom(
                          code,
                          deviceIdRef.current,
                          youPlay,
                          startFen,
                          myNick
                        )
                          .then(() => {
                            setRoomCode(code);
                            setMySide(youPlay);
                            setRoomVersion(0);
                            setRoomStatus("waiting");
                            // Subscribe to room
                            if (roomUnsubRef.current) roomUnsubRef.current();
                            roomUnsubRef.current = subscribeRoom(
                              code,
                              (room: RoomDoc | null) => {
                                if (!room) {
                                  setGameOverText(
                                    "Opponent left. Room closed."
                                  );
                                  setRoomStatus("finished");
                                  setRoomCode(null);
                                  setMySide(null);
                                  return;
                                }
                                // Infer my side if not known
                                if (!mySide) {
                                  if (
                                    room.players.white === deviceIdRef.current
                                  )
                                    setMySide("w");
                                  else if (
                                    room.players.black === deviceIdRef.current
                                  )
                                    setMySide("b");
                                }
                                setRoomStatus(room.status);
                                setRoomVersion(room.version);
                                void updateOpponentFromRoom(room);
                                // Load FEN & last move
                                try {
                                  gameRef.current = new Chess(room.fen);
                                  setBoard(fromFen(room.fen));
                                  setTurn(
                                    gameRef.current.turn() === "w"
                                      ? "white"
                                      : "black"
                                  );
                                  if (room.lastMove) {
                                    const lf = fromCoord(room.lastMove.from);
                                    const lt = fromCoord(room.lastMove.to);
                                    setLastMove({ from: lf, to: lt });
                                  }
                                } catch {}
                              }
                            );
                            setShowSetup("none");
                            void updateOpponentFromRoom({
                              fen: startFen,
                              turn: "w",
                              players: {
                                white:
                                  youPlay === "w" ? deviceIdRef.current : null,
                                black:
                                  youPlay === "b" ? deviceIdRef.current : null,
                              },
                              host: deviceIdRef.current,
                              status: "waiting",
                              lastMove: null,
                              version: 0,
                            } as RoomDoc);
                          })
                          .catch((e) => {
                            alert(e?.message || "Failed to create room");
                          });
                      } catch {}
                    }}
                  >
                    Create
                  </button>
                  <button
                    className="clickable btn btn--lg"
                    onClick={() => {
                      // Join room: ask code, join, subscribe
                      try {
                        const code = (window.prompt("Enter room code") || "")
                          .trim()
                          .toUpperCase();
                        if (!code) return;
                        // Disable engine in room mode
                        setBotLevel(null);
                        setEngineSide(null);
                        const myNick =
                          localStorage.getItem("terminal_nickname");
                        joinRoom(code, deviceIdRef.current, myNick)
                          .then(() => {
                            setRoomCode(code);
                            // Subscribe to room
                            if (roomUnsubRef.current) roomUnsubRef.current();
                            roomUnsubRef.current = subscribeRoom(
                              code,
                              (room: RoomDoc | null) => {
                                if (!room) {
                                  setGameOverText(
                                    "Opponent left. Room closed."
                                  );
                                  setRoomStatus("finished");
                                  setRoomCode(null);
                                  setMySide(null);
                                  return;
                                }
                                // Determine my side
                                if (
                                  room.players.white === deviceIdRef.current
                                ) {
                                  setMySide("w");
                                  setEngineSide(null); // white -> no flip
                                } else if (
                                  room.players.black === deviceIdRef.current
                                ) {
                                  setMySide("b");
                                  setEngineSide("w"); // flip board for black
                                }
                                setRoomStatus(room.status);
                                setRoomVersion(room.version);
                                void updateOpponentFromRoom(room);
                                try {
                                  gameRef.current = new Chess(room.fen);
                                  setBoard(fromFen(room.fen));
                                  setTurn(
                                    gameRef.current.turn() === "w"
                                      ? "white"
                                      : "black"
                                  );
                                  if (room.lastMove) {
                                    const lf = fromCoord(room.lastMove.from);
                                    const lt = fromCoord(room.lastMove.to);
                                    setLastMove({ from: lf, to: lt });
                                  }
                                } catch {}
                              }
                            );
                            setShowSetup("none");
                            // Opponent will be resolved via subscribe callback
                          })
                          .catch((e) =>
                            alert(e?.message || "Failed to join room")
                          );
                      } catch {}
                    }}
                  >
                    Join
                  </button>
                </div>
                <div style={{ marginTop: 14 }}>
                  <button
                    className="clickable btn btn--md"
                    onClick={() => setShowSetup("choose")}
                    style={{ opacity: 0.85 }}
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: 10 }}>
        {gameOverText && (
          <div
            style={{
              color: "#ff6b35",
              border: "1px solid #ff6b35",
              padding: "6px 10px",
              marginBottom: 8,
              textAlign: "center",
              textShadow: "none",
              animation: "none",
            }}
          >
            {gameOverText}
          </div>
        )}
        <div
          style={{
            width: boardSize,
            height: boardSize,
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gridTemplateRows: "repeat(8, 1fr)",
            border: "1px solid #ff6b35",
          }}
        >
          {Array.from({ length: 8 }).map((_, r) =>
            Array.from({ length: 8 }).map((__, c) => {
              const flipped = engineSide === "w"; // user plays black
              const mr = flipped ? 7 - r : r;
              const mc = flipped ? 7 - c : c;
              const isDark = (r + c) % 2 === 1;
              const piece = board[mr][mc];
              const isSelected =
                selected && selected.r === mr && selected.c === mc;
              const highlight = (
                legalTargets as ReadonlyArray<Square>
              ).includes(toCoord(mr, mc) as Square);
              const clickable = !!piece; // show pointer only on pieces
              const isLastFrom =
                !!lastMove.from &&
                lastMove.from.r === mr &&
                lastMove.from.c === mc;
              const isLastTo =
                !!lastMove.to && lastMove.to.r === mr && lastMove.to.c === mc;
              const squareClassName = [
                clickable ? "clickable" : "",
                isLastFrom ? "chess-square--last-from" : "",
                isLastTo ? "chess-square--last-to" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleSquareClick(mr, mc)}
                  className={squareClassName || undefined}
                  style={{
                    background: isDark ? "#111" : "#000",
                    border: isSelected
                      ? "1px solid #ff6b35"
                      : highlight
                      ? "1px dashed #ff6b35"
                      : "1px solid #222",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  {piece && (
                    <img
                      src={pieceToSvg[piece]}
                      alt={piece}
                      width={Math.floor((boardSize / 8) * 0.8)}
                      height={Math.floor((boardSize / 8) * 0.8)}
                      style={{
                        filter: "drop-shadow(0 0 6px rgba(255,107,53,0.4))",
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#ff6b35",
            marginTop: 8,
            textShadow: "none",
            animation: "none",
          }}
        >
          <div>Turn: {turn}</div>
          <div>{opponent}</div>
        </div>
      </div>
    </div>
  );
}

function fromFen(fen: string): string[][] {
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

function createPieceMap(): Record<string, string> {
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

const pieceMap = {
  p: "p",
  r: "r",
  n: "n",
  b: "b",
  q: "q",
  k: "k",
} as const;

function toCoord(r: number, c: number): string {
  // 0,0 is top-left; chess.js expects a1 bottom-left
  const file = String.fromCharCode("a".charCodeAt(0) + c);
  const rank = 8 - r;
  return `${file}${rank}`;
}

function fromCoord(coord: string): { r: number; c: number } {
  // coord like "e2"
  const file = coord.charCodeAt(0) - "a".charCodeAt(0);
  const rank = parseInt(coord[1], 10);
  const r = 8 - rank;
  const c = file;
  return { r, c };
}
