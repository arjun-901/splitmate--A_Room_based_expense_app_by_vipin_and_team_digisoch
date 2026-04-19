import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Hash, Loader2, Plus, Users2 } from "lucide-react";
import { createRoom, getMyRooms, joinRoom } from "../lib/api";
import type { AppUser, RoomSummary } from "../lib/types";

interface Props {
  user: AppUser;
  onJoin: (code: string) => void;
}

export default function RoomSelector({ user, onJoin }: Props) {
  const [roomName, setRoomName] = useState(`${user.displayName.split(" ")[0]}'s Room`);
  const [joinCode, setJoinCode] = useState("");
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [busyAction, setBusyAction] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRooms = async () => {
      try {
        setRooms(await getMyRooms());
      } catch (err) {
        console.error(err);
      }
    };
    void loadRooms();
  }, []);

  const handleCreateRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusyAction("create");
    setError("");
    try {
      const result = await createRoom(roomName.trim() || `${user.displayName}'s Room`);
      onJoin(result.code);
    } catch (err: any) {
      setError(err.message || "Failed to create room");
    } finally {
      setBusyAction(null);
    }
  };

  const handleJoinRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusyAction("join");
    setError("");
    try {
      const result = await joinRoom(joinCode.trim().toUpperCase());
      onJoin(result.code);
    } catch (err: any) {
      setError(err.message || "Failed to join room");
    } finally {
      setBusyAction(null);
    }
  };

  const initials = user.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <style>{`
        

        .rs-wrap {
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* ── Header ── */
        .rs-header {
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 22px;
          padding: 1.5rem;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .rs-header-left h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.3rem, 3vw, 1.75rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #0B0C0F;
          margin: 0 0 .25rem;
        }
        .rs-header-left p {
          font-size: 0.82rem;
          color: #6B7280;
          margin: 0;
        }
        .rs-user-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #F8F7F4;
          border: 1px solid #E5E7EB;
          border-radius: 100px;
          padding: 6px 14px 6px 6px;
          flex-shrink: 0;
        }
        .rs-user-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: #FF5C36;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 800;
          font-family: 'Syne', sans-serif;
          flex-shrink: 0;
        }
        .rs-user-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0B0C0F;
        }

        /* ── Error ── */
        .rs-error {
          background: #FFF0EE;
          border: 1px solid rgba(255,92,54,0.25);
          border-radius: 14px;
          padding: 12px 16px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #C93D1C;
        }

        /* ── Cards grid ── */
        .rs-cards {
          display: grid;
          gap: 1rem;
        }
        @media (min-width: 640px) {
          .rs-cards { grid-template-columns: 1fr 1fr; }
        }

        .rs-card {
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 22px;
          padding: 1.75rem 1.5rem;
          transition: border-color 0.2s, transform 0.2s;
        }
        .rs-card:hover { border-color: #D1D5DB; transform: translateY(-2px); }

        .rs-card-icon {
          width: 46px; height: 46px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.1rem;
          flex-shrink: 0;
        }

        .rs-card h2 {
          font-family: 'Syne', sans-serif;
          font-size: 1.15rem;
          font-weight: 800;
          color: #0B0C0F;
          margin: 0 0 .35rem;
        }
        .rs-card p {
          font-size: 0.8rem;
          color: #6B7280;
          line-height: 1.65;
          margin: 0 0 1.25rem;
        }

        .rs-label {
          display: block;
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #9CA3AF;
          margin-bottom: 6px;
        }
        .rs-input {
          width: 100%;
          border: 1.5px solid #E5E7EB;
          border-radius: 12px;
          padding: 11px 14px;
          background: #FAFAFA;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          color: #0B0C0F;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          margin-bottom: 1rem;
        }
        .rs-input:focus {
          border-color: #FF5C36;
          box-shadow: 0 0 0 3px rgba(255,92,54,0.1);
          background: #fff;
        }
        .rs-input::placeholder { color: #C4C9D4; }

        .rs-input-code {
          text-align: center;
          font-family: 'Syne', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: #0B0C0F;
        }

        .rs-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
        }
        .rs-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .rs-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .rs-btn-dark { background: #0B0C0F; color: #fff; }
        .rs-btn-dark:hover:not(:disabled) { background: #374151; }
        .rs-btn-brand { background: #FF5C36; color: #fff; }
        .rs-btn-brand:hover:not(:disabled) { background: #C93D1C; }

        .spin { animation: rs-spin 1s linear infinite; }
        @keyframes rs-spin { to { transform: rotate(360deg); } }

        /* ── Rooms list ── */
        .rs-rooms {
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 22px;
          padding: 1.5rem;
        }
        .rs-rooms-head {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 1.25rem;
        }
        .rs-rooms-icon {
          width: 38px; height: 38px;
          border-radius: 12px;
          background: #F3F4F6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6B7280;
          flex-shrink: 0;
        }
        .rs-rooms-head h3 {
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 800;
          color: #0B0C0F;
          margin: 0;
        }
        .rs-rooms-empty {
          border: 1.5px dashed #E5E7EB;
          border-radius: 14px;
          padding: 2.5rem 1rem;
          text-align: center;
          font-size: 0.82rem;
          color: #9CA3AF;
          font-weight: 500;
        }

        .rs-rooms-grid {
          display: grid;
          gap: 0.75rem;
        }
        @media (min-width: 480px) { .rs-rooms-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 900px) { .rs-rooms-grid { grid-template-columns: repeat(3, 1fr); } }

        .rs-room-btn {
          background: #F8F7F4;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          padding: 1.1rem;
          text-align: left;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, transform 0.2s;
          font-family: 'DM Sans', sans-serif;
          width: 100%;
        }
        .rs-room-btn:hover {
          border-color: #FF5C36;
          background: #fff;
          transform: translateY(-2px);
        }
        .rs-room-code {
          font-family: 'Syne', sans-serif;
          font-size: 1.15rem;
          font-weight: 800;
          letter-spacing: 0.2em;
          color: #FF5C36;
          margin-bottom: 0.4rem;
        }
        .rs-room-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: #0B0C0F;
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rs-room-meta {
          font-size: 0.72rem;
          color: #9CA3AF;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      `}</style>

      <div className="rs-wrap">

        {/* Header */}
        <div className="rs-header">
          <div className="rs-header-left">
            <h1>Your Rooms</h1>
            <p>Create a new room or join one with a code.</p>
          </div>
          <div className="rs-user-pill">
            <div className="rs-user-avatar">{initials}</div>
            <span className="rs-user-name">{user.displayName}</span>
          </div>
        </div>

        {/* Error */}
        {error && <div className="rs-error">{error}</div>}

        {/* Action cards */}
        <div className="rs-cards">

          {/* Create */}
          <motion.form whileHover={{ y: -3 }} onSubmit={handleCreateRoom} className="rs-card">
            <div className="rs-card-icon" style={{ background: "#FFF0EC" }}>
              <Plus size={22} color="#FF5C36" />
            </div>
            <h2>Create a Room</h2>
            <p>Start a new group. A unique 6-character code will be generated automatically.</p>
            <label className="rs-label">Room name</label>
            <input
              className="rs-input"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Goa Trip"
            />
            <button type="submit" disabled={busyAction !== null} className="rs-btn rs-btn-dark">
              {busyAction === "create"
                ? <Loader2 size={16} className="spin" />
                : <Plus size={16} />}
              Create Room
            </button>
          </motion.form>

          {/* Join */}
          <motion.form whileHover={{ y: -3 }} onSubmit={handleJoinRoom} className="rs-card">
            <div className="rs-card-icon" style={{ background: "#FFFBEB" }}>
              <Hash size={22} color="#D97706" />
            </div>
            <h2>Join with Code</h2>
            <p>Enter a 6-character room code to join an existing group instantly.</p>
            <label className="rs-label">Room code</label>
            <input
              className="rs-input rs-input-code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="X7K9P2"
            />
            <button type="submit" disabled={busyAction !== null} className="rs-btn rs-btn-brand">
              {busyAction === "join"
                ? <Loader2 size={16} className="spin" />
                : <ArrowRight size={16} />}
              Join Room
            </button>
          </motion.form>
        </div>

        {/* Rooms list */}
        <div className="rs-rooms">
          <div className="rs-rooms-head">
            <div className="rs-rooms-icon"><Users2 size={18} /></div>
            <h3>Recent Rooms</h3>
          </div>

          {rooms.length === 0 ? (
            <div className="rs-rooms-empty">No rooms yet — create or join one above.</div>
          ) : (
            <div className="rs-rooms-grid">
              {rooms.map((room) => (
                <button key={room.code} onClick={() => onJoin(room.code)} className="rs-room-btn">
                  <div className="rs-room-code">{room.code}</div>
                  <div className="rs-room-name">{room.name}</div>
                  <div className="rs-room-meta">
                    <Users2 size={11} />
                    {room.membersCount} members
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}