"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { STATIONS, lineColor } from "@/lib/stations";
import type { Quest } from "@/lib/quest";

const VIBES = [
  { id: "chill", label: "🌮 Chill eats" },
  { id: "big-night", label: "🪩 Big night out" },
  { id: "explore", label: "🧭 Explore" },
  { id: "study", label: "📚 Study spot" },
  { id: "late-night", label: "🌙 Late night" },
] as const;

const fmtHours = (h: number) => (h % 1 ? `${h} hrs` : `${h} hr${h === 1 ? "" : "s"}`);

export default function QuestPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [budget, setBudget] = useState(25);
  const [groupSize, setGroupSize] = useState(4);
  const [hours, setHours] = useState(3);
  const [startStation, setStart] = useState("place-bucen");
  const [vibe, setVibe] = useState<(typeof VIBES)[number]["id"]>("chill");
  const [craving, setCraving] = useState("");
  const [over21, setOver21] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quest, setQuest] = useState<Quest | null>(null);
  const [stamps, setStamps] = useState<Record<string, boolean>>({});
  const [badges, setBadges] = useState<string[]>([]);

  useEffect(() => {
    try { setBadges(JSON.parse(localStorage.getItem("tq-badges") || "[]")); } catch {}
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("unauthorized");
        if (active) setAuthenticated(true);
      })
      .catch(() => {
        if (active) router.replace("/login");
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => { active = false; };
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function go() {
    setLoading(true);
    setQuest(null);
    setStamps({});
    try {
      const res = await fetch("/api/quest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ budget, groupSize, hours, startStation, vibe, craving: craving || undefined, over21 }),
      });
      setQuest(await res.json());
    } finally {
      setLoading(false);
    }
  }

  const stops = quest?.steps.filter((s) => s.kind === "stop") ?? [];
  const allStamped = stops.length > 0 && stops.every((s) => s.kind === "stop" && stamps[s.place.id]);

  useEffect(() => {
    if (!allStamped || !quest) return;
    const lines = Array.from(new Set(quest.steps.flatMap((s) => (s.kind === "ride" ? [s.line.split(" ")[0]] : []))));
    const earned = [`🏁 ${quest.title}`, ...lines.map((l) => `🚇 ${l} Line Rider`), ...(vibe === "late-night" ? ["🦉 Night Owl"] : [])];
    const next = Array.from(new Set([...badges, ...earned]));
    setBadges(next);
    try { localStorage.setItem("tq-badges", JSON.stringify(next)); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allStamped]);

  if (authLoading) {
    return (
      <>
        <div className="strip">
          <span style={{ background: "var(--green)" }} /><span style={{ background: "var(--red)" }} />
          <span style={{ background: "var(--orange)" }} /><span style={{ background: "var(--blue)" }} />
        </div>
        <main className="wrap"><div className="empty"><p>Checking your T-Quest account...</p></div></main>
      </>
    );
  }
  if (!authenticated) return null;

  return (
    <>
      <div className="strip">
        <span style={{ background: "var(--green)" }} /><span style={{ background: "var(--red)" }} />
        <span style={{ background: "var(--orange)" }} /><span style={{ background: "var(--blue)" }} />
      </div>
      <main className="wrap">
        <header className="hero">
          <div>
            <div className="logo">
              <div className="tbadge">T</div>
              <h1 className="display">T-Quest</h1>
            </div>
            <p>Tell us your budget, your crew, and your vibe. We build the night. You just ride the T.</p>
          </div>
          {badges.length > 0 && (
            <div className="badges">{badges.slice(-4).map((b) => <span key={b} className="badge">{b}</span>)}</div>
          )}
          <button className="btn2" onClick={logout}>Log out</button>
        </header>

        <div className="grid">
          <section className="panel">
            <h2 className="display">Build your quest</h2>

            <label className="f">Budget per person <span className="val">${budget}</span></label>
            <input type="range" min={0} max={120} step={5} value={budget} onChange={(e) => setBudget(+e.target.value)} />

            <label className="f">Crew size <span className="val">{groupSize}</span></label>
            <input type="range" min={1} max={12} value={groupSize} onChange={(e) => setGroupSize(+e.target.value)} />

            <label className="f">Time you've got <span className="val">{fmtHours(hours)}</span></label>
            <input type="range" min={1} max={8} step={0.5} value={hours} onChange={(e) => setHours(+e.target.value)} />

            <label className="f">Starting from</label>
            <select value={startStation} onChange={(e) => setStart(e.target.value)}>
              {STATIONS.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.lines.join(", ")})</option>)}
            </select>

            <label className="f">Vibe</label>
            <div className="chips">
              {VIBES.map((v) => (
                <button key={v.id} className={`chip ${vibe === v.id ? "on" : ""}`} onClick={() => setVibe(v.id)}>{v.label}</button>
              ))}
            </div>

            <label className="f">Craving (optional)</label>
            <input type="text" placeholder="tacos, ramen, jazz, matcha..." value={craving} onChange={(e) => setCraving(e.target.value)} />

            <label className="toggle">
              <input type="checkbox" checked={over21} onChange={(e) => setOver21(e.target.checked)} />
              Everyone in the crew is 21+
            </label>

            <button className="go" onClick={go} disabled={loading}>{loading ? "Building your quest..." : "Start a quest →"}</button>
          </section>

          <section>
            {loading && (
              <div className="panel loading">
                <div className="train-anim">🚋</div>
                <p><b>Checking the T, scouting spots, doing the budget math...</b></p>
              </div>
            )}
            {!loading && !quest && (
              <div className="empty">
                <div className="big">🗺️</div>
                <p><b>No more "idk, where do you wanna go?"</b></p>
                <p>Set your budget, crew, and vibe, then hit Start. You'll get one route with real spots, live train times, and a ride home.</p>
              </div>
            )}
            {!loading && quest && (
              <div className="panel">
                <div className="quest-head">
                  <div>
                    <span className="tag">{quest.generatedBy === "gemini" ? "✨ Built by Gemini agent" : "Quick quest"}</span>
                    <h2 className="display" style={{ marginTop: 8 }}>{quest.title}</h2>
                    <p>{quest.tagline}</p>
                  </div>
                </div>
                <div className="stats">
                  <div className="stat"><b>${quest.perPerson}</b><span>per person</span></div>
                  <div className="stat"><b>${quest.groupTotal}</b><span>whole crew</span></div>
                  <div className="stat"><b>~{Math.round((quest.totalMinutes / 60) * 10) / 10}h</b><span>total time</span></div>
                </div>
                {quest.warnings.map((w) => <div key={w} className="warn">⚠️ {w}</div>)}

                <ol className="timeline">
                  {quest.steps.map((s, i) =>
                    s.kind === "ride" ? (
                      <li key={i} className="step ride" style={{ ["--c" as any]: s.color }}>
                        <span className="dot" />
                        <div className="ride-line">
                          <span className="pill" style={{ background: s.color }}>{s.line}</span>
                          {s.from} → {s.to}
                        </div>
                        {s.transferAt && <div className="stop-meta">Transfer at {s.transferAt}</div>}
                        <div className="stop-meta">Get off at <b>{s.to}</b></div>
                        {s.nextTrains.length > 0 && (
                          <div className="trains">
                            {s.nextTrains.map((t, j) => (
                              <span key={j} className="train" style={{ borderColor: lineColor(t.route) }}>
                                {t.minutes === 0 ? "Now" : `${t.minutes} min`}{t.headsign ? ` · ${t.headsign}` : ""}
                              </span>
                            ))}
                          </div>
                        )}
                      </li>
                    ) : (
                      <li key={i} className="step">
                        <span className="dot" style={{ background: stamps[s.place.id] ? "var(--accent)" : "#fff" }} />
                        <div className="stop-card">
                          <h3>{s.place.name} {s.place.trending && <span className="tag hot">🔥 Trending</span>}</h3>
                          <div className="stop-meta">
                            ~${s.place.price}/person · {s.place.walk} min walk from {s.station} · ~{s.minutes} min here
                          </div>
                          <p>{s.why}</p>
                          <div className="row" style={{ marginTop: 10 }}>
                            <button
                              className={`btn2 ${stamps[s.place.id] ? "done" : ""}`}
                              onClick={() => setStamps((x) => ({ ...x, [s.place.id]: !x[s.place.id] }))}
                            >
                              {stamps[s.place.id] ? "✓ Stamped" : "Check in & stamp"}
                            </button>
                            <a className="btn2" target="_blank" rel="noreferrer"
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.place.name + " Boston")}`}>
                              Map
                            </a>
                          </div>
                        </div>
                      </li>
                    )
                  )}
                </ol>
                {allStamped && <div className="warn" style={{ background: "#d8f5e3" }}>🏁 Quest complete! New badges unlocked.</div>}
                <div className="row">
                  <button className="btn2" onClick={go}>🎲 Reroll</button>
                  <button className="btn2" onClick={() => navigator.clipboard?.writeText(window.location.href)}>Share with the group chat</button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
