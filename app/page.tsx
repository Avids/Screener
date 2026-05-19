"use client";

import { FormEvent, useMemo, useState } from "react";
import { DEFAULT_TICKERS } from "../lib/universe";

type Result = {
  symbol: string;
  close: number;
  dailyPct: number;
  weeklyPct: number;
  atrExtension: number;
  dollarVolume: number;
  score: number;
  tags: {
    qullamaggie: boolean;
    minervini: boolean;
    stockbee9m: boolean;
    stockbee20w: boolean;
    stockbee4d: boolean;
  };
};

type ApiResponse = { asOf?: string; results?: Result[]; errors?: string[]; provider?: string };

const groups = [
  ["qullamaggie", "Qullamaggie", "KQ"],
  ["minervini", "Minervini", "MM"],
  ["stockbee9m", "9M Movers", "SB9"],
  ["stockbee20w", "20% Weekly", "SBW"],
  ["stockbee4d", "4% Daily", "SB4"]
] as const;

export default function Page() {
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_TICKERS);
  const [newTicker, setNewTicker] = useState("");
  const [finnhubKey, setFinnhubKey] = useState("");
  const [polygonKey, setPolygonKey] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [asOf, setAsOf] = useState("");
  const [provider, setProvider] = useState("Yahoo Finance");
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("atrExtension");

  const addTicker = (event: FormEvent) => {
    event.preventDefault();
    const symbol = newTicker.trim().toUpperCase();
    if (!symbol) return;
    setWatchlist((prev) => (prev.includes(symbol) ? prev : [...prev, symbol]));
    setNewTicker("");
  };

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers: watchlist, sortBy, finnhubKey: finnhubKey.trim(), polygonKey: polygonKey.trim() })
      });
      const json: ApiResponse = await res.json();
      setResults(json.results ?? []);
      setErrors(json.errors ?? []);
      setAsOf(json.asOf ?? "");
      setProvider(json.provider ?? "Yahoo Finance");
    } finally {
      setLoading(false);
    }
  }

  const sorted = useMemo(() => [...results].sort((a, b) => sortBy === "atrExtension" ? a.atrExtension - b.atrExtension : sortBy === "daily" ? b.dailyPct - a.dailyPct : b.weeklyPct - a.weeklyPct), [results, sortBy]);

  return <main className="terminal-shell">
    <div className="crt" />
    <div className="wrap">
      <h1>▣ Guru Terminal Screener</h1>
      <p className="muted">Live market scan with fallback providers and editable default watchlist.</p>

      <section className="panel">
        <div className="row">
          <label>Finnhub API Key</label>
          <input value={finnhubKey} onChange={e => setFinnhubKey(e.target.value)} placeholder="Optional - use your Finnhub key" type="password" autoComplete="off" />
        </div>
        <div className="row">
          <label>Polygon API Key</label>
          <input value={polygonKey} onChange={e => setPolygonKey(e.target.value)} placeholder="Optional - use your Polygon key" type="password" autoComplete="off" />
        </div>
      </section>

      <section className="panel">
        <h2>Default monitored symbols ({watchlist.length})</h2>
        <div className="chips">
          {watchlist.map(symbol => (
            <button key={symbol} className="chip" onClick={() => setWatchlist(prev => prev.filter(s => s !== symbol))}>✕ {symbol}</button>
          ))}
        </div>
        <form onSubmit={addTicker} className="add-row">
          <input value={newTicker} onChange={e => setNewTicker(e.target.value)} placeholder="Add symbol (e.g. ADBE)" />
          <button type="submit">Add</button>
        </form>
      </section>

      <section className="panel actions">
        <div className="row-inline">
          <label>Sort by</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}><option value="atrExtension">ATR Extension</option><option value="daily">Daily %</option><option value="weekly">Weekly %</option></select>
          <button onClick={run} disabled={loading || watchlist.length === 0}>{loading ? "Scanning..." : "Run live scan"}</button>
        </div>
        <p className="muted">Provider used: {provider} · {asOf ? `Last scan ${new Date(asOf).toLocaleString()}` : "Not run yet"}</p>
        {errors.length > 0 && <p className="warn">Unavailable symbols: {errors.join(", ")}</p>}
      </section>

      <div className="grid">
        {groups.map(([key, title, code]) => {
          const items = sorted.filter((r) => r.tags[key]);
          return <article key={key} className="card">
            <header>{title} <span>{code}</span> <b>{items.length}</b></header>
            <div>
              {items.map((r) => <a key={key + r.symbol} href={`https://finance.yahoo.com/quote/${r.symbol}`} target="_blank" className="line"><span>{r.symbol}</span><span>{key === "stockbee20w" ? `1W +${r.weeklyPct.toFixed(1)}%` : `+${r.dailyPct.toFixed(1)}%`}</span><small>ATR {r.atrExtension.toFixed(1)}</small></a>)}
            </div>
          </article>;
        })}
      </div>
    </main>
  );
}
