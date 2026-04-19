import React from "react";
import { Home, LayoutDashboard, LogOut, Menu, Sparkles, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearStoredRoom, clearStoredToken } from "../lib/api";
import type { AppUser } from "../lib/types";

interface Props {
  user: AppUser | null;
  setUser: (user: AppUser | null) => void;
  currentRoom?: string | null;
}

export default function Navbar({ user, setUser, currentRoom }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = () => {
    clearStoredToken();
    clearStoredRoom();
    setUser(null);
    setIsMenuOpen(false);
    navigate("/");
  };

  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const dashboardLink = currentRoom ? `/dashboard/${currentRoom}` : "/dashboard";

  const navItemClass = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black tracking-tight transition ${
      active
        ? "bg-white/85 text-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
        : "text-slate-600 hover:bg-white/70 hover:text-slate-950"
    }`;

  const mobileNavItemClass = (active: boolean) =>
    `flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-black tracking-tight transition ${
      active
        ? "bg-white text-slate-950 shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
        : "bg-white/60 text-slate-700 hover:bg-white hover:text-slate-950"
    }`;

  const homeActive = location.pathname === "/";
  const dashboardActive = location.pathname.startsWith("/dashboard");

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-5">
      <div className="mx-auto max-w-7xl rounded-[28px] bg-gradient-to-r from-[#ffb39e]/70 via-white/70 to-[#bfc7ff]/70 p-[1px] shadow-[0_18px_80px_rgba(15,23,42,0.12)]">
        <div className="rounded-[27px] border border-white/50 bg-white/55 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <Link to="/" className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-950 text-lg font-black text-white shadow-[0_14px_34px_rgba(15,23,42,0.25)]">
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)]" />
                <span className="relative">S</span>
              </div>

              <div className="min-w-0">
                <p className="truncate text-lg font-black tracking-tight text-slate-950 sm:text-xl">SplitMate</p>
                <div className="hidden items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 sm:flex">
                  <Sparkles size={12} className="text-[#ff5c36]" />
                  Room based expense app
                </div>
              </div>
            </Link>

            <div className="hidden items-center gap-2 lg:flex">
              <nav className="flex items-center gap-2 rounded-[24px] border border-white/60 bg-white/35 px-2 py-2">
                <Link to="/" className={navItemClass(homeActive)}>
                  <Home size={16} />
                  Home
                </Link>

                {user && (
                  <Link to={dashboardLink} className={navItemClass(dashboardActive)}>
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>
                )}
              </nav>

              {user ? (
                <>
                  <div className="rounded-[24px] border border-white/60 bg-white/45 px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Signed in</p>
                    <p className="max-w-[160px] truncate text-sm font-black text-slate-950">{user.displayName}</p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-[24px] bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(15,23,42,0.24)] transition hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center rounded-[24px] border border-white/70 bg-white/55 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-white hover:text-slate-950"
                  >
                    Login
                  </Link>
                  <Link
                    to="/login?register=true"
                    className="inline-flex items-center rounded-[24px] bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(15,23,42,0.24)] transition hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/60 text-slate-900 backdrop-blur-xl transition hover:bg-white lg:hidden"
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="border-t border-white/60 px-4 pb-4 pt-3 lg:hidden">
              <div className="rounded-[24px] bg-gradient-to-br from-white/80 via-white/65 to-[#eef2ff]/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                <nav className="flex flex-col gap-2">
                  <Link to="/" className={mobileNavItemClass(homeActive)}>
                    <Home size={18} />
                    Home
                  </Link>

                  {user && (
                    <Link to={dashboardLink} className={mobileNavItemClass(dashboardActive)}>
                      <LayoutDashboard size={18} />
                      Dashboard
                    </Link>
                  )}
                </nav>

                {user ? (
                  <div className="mt-3 space-y-3">
                    <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Signed in</p>
                      <p className="mt-1 text-sm font-black text-slate-950">{user.displayName}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Continue managing your shared room expenses from one place.
                      </p>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-black text-white transition hover:bg-slate-800"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 grid gap-2">
                    <Link
                      to="/login"
                      className="flex items-center justify-center rounded-2xl border border-white/70 bg-white/85 px-4 py-3.5 text-sm font-black text-slate-700 transition hover:bg-white hover:text-slate-950"
                    >
                      Login
                    </Link>
                    <Link
                      to="/login?register=true"
                      className="flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-black text-white transition hover:bg-slate-800"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
