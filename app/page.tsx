"use client";
import { useMemo, useState } from "react";

type Result = {
  symbol: string; close: number; dailyPct: number; weeklyPct: number; atrExtension: number; dollarVolume: number; score: number;
  tags: { qullamaggie: boolean; minervini: boolean; stockbee9m: boolean; stockbee20w: boolean; stockbee4d: boolean };
};

const groups = [
  ["qullamaggie", "Qullamaggie", "KQ"],
  ["minervini", "Minervini", "MM"],
  ["stockbee9m", "9M Movers", "SB9"],
  ["stockbee20w", "20% Weekly", "SBW"],
  ["stockbee4d", "4% Daily", "SB4"]
] as const;

export default function Page() {
  const [raw, setRaw] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("atrExtension");

  async function run() {
    setLoading(true);
    const tickers = raw.split(/[\s,]+/).filter(Boolean);
    const res = await fetch("/api/screen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tickers, sortBy }) });
    const json = await res.json();
    setResults(json.results ?? []);
    setLoading(false);
  }

  const sorted = useMemo(() => [...results].sort((a,b) => sortBy === "atrExtension" ? a.atrExtension - b.atrExtension : sortBy === "daily" ? b.dailyPct - a.dailyPct : b.weeklyPct - a.weeklyPct), [results, sortBy]);

  return <main className="min-h-screen bg-[#090d14] text-white p-4 md:p-8">
    <div className="max-w-7xl mx-auto">
      <nav className="flex gap-6 border-b border-slate-800 pb-3 text-sm text-slate-300"><b className="text-red-400">Gurus</b><span>Signals</span><span>Liquid Leaders</span><span>Stage Analysis</span><span>Heatmap</span></nav>
      <section className="my-8 grid md:grid-cols-[1fr_auto_auto] gap-4 items-end">
        <label className="block"><span className="text-sm text-slate-400">Tickers, optional</span><textarea className="mt-2 w-full h-24 rounded-xl bg-slate-900 border border-slate-700 p-3" placeholder="Leave blank for default universe, or paste symbols separated by commas" value={raw} onChange={e=>setRaw(e.target.value)} /></label>
        <label className="block"><span className="text-sm text-slate-400">Sort by</span><select className="mt-2 w-full rounded-xl bg-slate-900 border border-slate-700 p-3" value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="atrExtension">ATR Extension</option><option value="daily">Daily %</option><option value="weekly">Weekly %</option></select></label>
        <button onClick={run} disabled={loading} className="rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-60 px-6 py-3 font-semibold">{loading ? "Scanning..." : "Run scan"}</button>
      </section>
      <div className="grid md:grid-cols-5 gap-5">
        {groups.map(([key, title, code]) => {
          const items = sorted.filter(r => r.tags[key]);
          return <div key={key}>
            <div className="rounded-lg bg-emerald-400 text-slate-950 text-center p-3 mb-3 font-bold"><div className="text-2xl">{items.length}</div><div className="text-xs">{title} · {code}</div></div>
            <div className="space-y-2">{items.map(r => <a key={key + r.symbol} href={`https://finance.yahoo.com/quote/${r.symbol}`} target="_blank" className="flex items-center justify-between rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 border-l-4 border-emerald-400">
              <span className="font-bold">{r.symbol}</span><span className="text-emerald-400 text-sm">{key === "stockbee20w" ? `1W +${r.weeklyPct.toFixed(1)}%` : `+${r.dailyPct.toFixed(1)}%`}</span><span className="text-xs rounded-md border border-yellow-400 text-yellow-300 px-2 py-0.5">{r.atrExtension.toFixed(1)}</span>
            </a>)}</div>
          </div>})}
      </div>
    </div>
  </main>;
}
