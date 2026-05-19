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

type ApiResponse = {
  asOf?: string;
  results?: Result[];
  errors?: string[];
};

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
  const [results, setResults] = useState<Result[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [asOf, setAsOf] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("atrExtension");

  const addTicker = (event: FormEvent) => {
    event.preventDefault();
    const symbol = newTicker.trim().toUpperCase();
    if (!symbol) return;
    setWatchlist((prev) => (prev.includes(symbol) ? prev : [...prev, symbol]));
    setNewTicker("");
  };

  const removeTicker = (symbol: string) => {
    setWatchlist((prev) => prev.filter((item) => item !== symbol));
  };

  async function run() {
    setLoading(true);
    setErrors([]);

    try {
      const res = await fetch("/api/screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers: watchlist, sortBy })
      });

      const json: ApiResponse = await res.json();
      setResults(json.results ?? []);
      setErrors(json.errors ?? []);
      setAsOf(json.asOf ?? "");
    } finally {
      setLoading(false);
    }
  }

  const sorted = useMemo(
    () =>
      [...results].sort((a, b) =>
        sortBy === "atrExtension"
          ? a.atrExtension - b.atrExtension
          : sortBy === "daily"
            ? b.dailyPct - a.dailyPct
            : b.weeklyPct - a.weeklyPct
      ),
    [results, sortBy]
  );

  return (
    <main className="min-h-screen bg-[#090d14] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <nav className="flex gap-6 border-b border-slate-800 pb-3 text-sm text-slate-300">
          <b className="text-red-400">Gurus</b>
          <span>Signals</span>
          <span>Liquid Leaders</span>
          <span>Stage Analysis</span>
          <span>Heatmap</span>
        </nav>

        <section className="my-8 grid md:grid-cols-[1fr_auto] gap-4 items-end">
          <div>
            <span className="text-sm text-slate-400">Default monitored watchlist ({watchlist.length})</span>
            <div className="mt-2 rounded-xl bg-slate-900 border border-slate-700 p-3 max-h-52 overflow-y-auto flex flex-wrap gap-2">
              {watchlist.map((ticker) => (
                <button
                  key={ticker}
                  type="button"
                  onClick={() => removeTicker(ticker)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs hover:border-red-400 hover:text-red-300"
                  title={`Remove ${ticker}`}
                >
                  <span className="text-red-400">✕</span>
                  <span>{ticker}</span>
                </button>
              ))}
            </div>
            <form onSubmit={addTicker} className="mt-3 flex gap-2">
              <input
                value={newTicker}
                onChange={(event) => setNewTicker(event.target.value)}
                placeholder="Add symbol (e.g., ADBE)"
                className="flex-1 rounded-xl bg-slate-900 border border-slate-700 p-3"
              />
              <button type="submit" className="rounded-xl bg-slate-700 hover:bg-slate-600 px-4 py-2">
                Add
              </button>
            </form>
          </div>

          <div className="grid gap-4">
            <label className="block">
              <span className="text-sm text-slate-400">Sort by</span>
              <select
                className="mt-2 w-full rounded-xl bg-slate-900 border border-slate-700 p-3"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="atrExtension">ATR Extension</option>
                <option value="daily">Daily %</option>
                <option value="weekly">Weekly %</option>
              </select>
            </label>
            <button
              onClick={run}
              disabled={loading || watchlist.length === 0}
              className="rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-60 px-6 py-3 font-semibold"
            >
              {loading ? "Scanning live data..." : "Run live scan"}
            </button>
          </div>
        </section>

        <p className="text-xs text-slate-400 mb-4">
          Data source: Yahoo Finance historical candles (live fetch at request time)
          {asOf ? ` · Last scan: ${new Date(asOf).toLocaleString()}` : ""}
        </p>
        {errors.length > 0 && (
          <p className="text-xs text-amber-300 mb-4">Unavailable symbols: {errors.join(", ")}</p>
        )}

        <div className="grid md:grid-cols-5 gap-5">
          {groups.map(([key, title, code]) => {
            const items = sorted.filter((result) => result.tags[key]);
            return (
              <div key={key}>
                <div className="rounded-lg bg-emerald-400 text-slate-950 text-center p-3 mb-3 font-bold">
                  <div className="text-2xl">{items.length}</div>
                  <div className="text-xs">
                    {title} · {code}
                  </div>
                </div>
                <div className="space-y-2">
                  {items.map((result) => (
                    <a
                      key={key + result.symbol}
                      href={`https://finance.yahoo.com/quote/${result.symbol}`}
                      target="_blank"
                      className="flex items-center justify-between rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 border-l-4 border-emerald-400"
                    >
                      <span className="font-bold">{result.symbol}</span>
                      <span className="text-emerald-400 text-sm">
                        {key === "stockbee20w" ? `1W +${result.weeklyPct.toFixed(1)}%` : `+${result.dailyPct.toFixed(1)}%`}
                      </span>
                      <span className="text-xs rounded-md border border-yellow-400 text-yellow-300 px-2 py-0.5">
                        {result.atrExtension.toFixed(1)}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
