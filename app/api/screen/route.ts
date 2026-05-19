import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";
import { screenTicker, ScreenResult } from "../../../lib/screener";
import { DEFAULT_TICKERS } from "../../../lib/universe";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  tickers?: string[];
  sortBy?: "atrExtension" | "daily" | "weekly";
  finnhubKey?: string;
  polygonKey?: string;
};

async function fromYahoo(symbol: string) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 420);
  return yahooFinance.historical(symbol, { period1: start, period2: end, interval: "1d" });
}

async function fromFinnhub(symbol: string, key: string) {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 420 * 24 * 60 * 60;
  const res = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${key}`, { cache: "no-store" });
  if (!res.ok) throw new Error("finnhub failed");
  const j = await res.json();
  if (j.s !== "ok" || !Array.isArray(j.t)) throw new Error("finnhub empty");
  return j.t.map((t: number, i: number) => ({ date: new Date(t * 1000), open: j.o[i], high: j.h[i], low: j.l[i], close: j.c[i], volume: j.v[i] }));
}

async function fromPolygon(symbol: string, key: string) {
  const to = new Date();
  const from = new Date(Date.now() - 420 * 24 * 60 * 60 * 1000);
  const u = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${from.toISOString().slice(0,10)}/${to.toISOString().slice(0,10)}?adjusted=true&sort=asc&limit=5000&apiKey=${key}`;
  const res = await fetch(u, { cache: "no-store" });
  if (!res.ok) throw new Error("polygon failed");
  const j = await res.json();
  if (!Array.isArray(j.results)) throw new Error("polygon empty");
  return j.results.map((r: any) => ({ date: new Date(r.t), open: r.o, high: r.h, low: r.l, close: r.c, volume: r.v }));
}

async function fetchHistory(symbol: string, finnhubKey?: string, polygonKey?: string) {
  if (polygonKey) {
    try { return { rows: await fromPolygon(symbol, polygonKey), provider: "Polygon" }; } catch {}
  }
  if (finnhubKey) {
    try { return { rows: await fromFinnhub(symbol, finnhubKey), provider: "Finnhub" }; } catch {}
  }
  return { rows: await fromYahoo(symbol), provider: "Yahoo Finance" };
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const tickers = (body.tickers?.length ? body.tickers : DEFAULT_TICKERS).map(t => t.trim().toUpperCase()).filter(Boolean).slice(0, 350);

  const results: ScreenResult[] = [];
  const errors: string[] = [];
  let provider = body.polygonKey ? "Polygon→fallback" : body.finnhubKey ? "Finnhub→fallback" : "Yahoo Finance";

  await Promise.all(tickers.map(async (symbol) => {
    try {
      const fetched = await fetchHistory(symbol, body.finnhubKey, body.polygonKey);
      provider = fetched.provider;
      const result = screenTicker(symbol, fetched.rows as any[]);
      if (result) results.push(result);
    } catch {
      errors.push(symbol);
    }
  }));

  return NextResponse.json({ asOf: new Date().toISOString(), results, errors, provider });
}
