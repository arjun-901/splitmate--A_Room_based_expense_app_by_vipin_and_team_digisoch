import React, { useState } from "react";
import { motion } from "motion/react";
import { Loader2, LockKeyhole, LogIn, Mail, UserPlus } from "lucide-react";
import { login, register, storeToken } from "../lib/api";
import type { AppUser } from "../lib/types";

interface Props {
  onAuthenticated: (user: AppUser) => void;
  initialIsRegister?: boolean;
}

export default function AuthCard({ onAuthenticated, initialIsRegister = false }: Props) {
  const [mode, setMode] = useState<"login" | "register">(initialIsRegister ? "register" : "login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isRegister = mode === "register";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = isRegister
        ? await register({ displayName, email, password })
        : await login({ email, password });
      storeToken(result.token);
      onAuthenticated(result.user);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        
        .auth-wrap {
          display: flex;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
        }

        /* Right card */
        .auth-right {
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 24px;
          padding: 2rem 1.75rem;
          width: 100%;
          max-width: 440px;
        }
        @media (min-width: 640px) { .auth-right { padding: 2.5rem; } }

        .auth-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 2rem;
        }
        .auth-brand-icon {
          width: 40px; height: 40px;
          border-radius: 12px;
          background: #FF5C36;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.1rem;
          color: #fff;
        }
        .auth-brand-name {
          font-family: 'Syne', sans-serif;
          font-size: 1.2rem;
          font-weight: 800;
          color: #0B0C0F;
        }
        .auth-brand-sub {
          font-size: 0.7rem;
          color: #9CA3AF;
          font-weight: 500;
        }

        .auth-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          background: #F3F4F6;
          border-radius: 14px;
          padding: 4px;
          margin-bottom: 1.75rem;
        }
        .auth-tab {
          border: none;
          border-radius: 10px;
          padding: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          color: #6B7280;
          background: transparent;
        }
        .auth-tab.active {
          background: #fff;
          color: #0B0C0F;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }

        .auth-field { margin-bottom: 1rem; }
        .auth-field-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #6B7280;
          margin-bottom: 6px;
        }
        .auth-input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1.5px solid #E5E7EB;
          border-radius: 14px;
          padding: 11px 14px;
          background: #FAFAFA;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .auth-input-wrap:focus-within {
          border-color: #FF5C36;
          box-shadow: 0 0 0 3px rgba(255,92,54,0.1);
          background: #fff;
        }
        .auth-input-wrap svg { color: #9CA3AF; flex-shrink: 0; }
        .auth-input-wrap input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          color: #0B0C0F;
        }
        .auth-input-wrap input::placeholder { color: #C4C9D4; }

        .auth-error {
          background: #FFF0EE;
          border: 1px solid rgba(255,92,54,0.2);
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 0.82rem;
          color: #C93D1C;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        .auth-submit {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px;
          border-radius: 14px;
          background: #0B0C0F;
          color: #fff;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          margin-top: 0.5rem;
        }
        .auth-submit:hover:not(:disabled) { background: #374151; transform: translateY(-1px); }
        .auth-submit:disabled { opacity: 0.55; cursor: not-allowed; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="auth-wrap">
        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="auth-right"
        >
          <div className="auth-brand">
            <div className="auth-brand-icon">S</div>
            <div>
              <div className="auth-brand-name">SplitEase</div>
              <div className="auth-brand-sub">Room-based expense tracker</div>
            </div>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab${!isRegister ? " active" : ""}`}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-tab${isRegister ? " active" : ""}`}
              onClick={() => setMode("register")}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div className="auth-field">
                <label className="auth-field-label">Display name</label>
                <div className="auth-input-wrap">
                  <UserPlus size={16} />
                  <input
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Arjun Singh"
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label className="auth-field-label">Email</label>
              <div className="auth-input-wrap">
                <Mail size={16} />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-field-label">Password</label>
              <div className="auth-input-wrap">
                <LockKeyhole size={16} />
                <input
                  required
                  minLength={6}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                />
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" disabled={loading} className="auth-submit">
              {loading
                ? <Loader2 size={17} className="spin" />
                : isRegister
                  ? <UserPlus size={17} />
                  : <LogIn size={17} />}
              {isRegister ? "Create Account" : "Login"}
            </button>
          </form>
        </motion.div>
      </div>
    </>
  );
}