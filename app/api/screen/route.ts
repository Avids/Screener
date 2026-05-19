import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";
import { screenTicker, ScreenResult } from "../../../lib/screener";
import { DEFAULT_TICKERS } from "../../../lib/universe";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = { tickers?: string[]; sortBy?: "atrExtension" | "daily" | "weekly" };

async function fetchHistory(symbol: string) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 420);
  return yahooFinance.historical(symbol, {
    period1: start,
    period2: end,
    interval: "1d"
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const tickers = (body.tickers?.length ? body.tickers : DEFAULT_TICKERS)
    .map(t => t.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 250);

  const batches: string[][] = [];
  for (let i = 0; i < tickers.length; i += 20) batches.push(tickers.slice(i, i + 20));

  const results: ScreenResult[] = [];
  const errors: string[] = [];

  for (const batch of batches) {
    await Promise.all(batch.map(async symbol => {
      try {
        const rows = await fetchHistory(symbol);
        const result = screenTicker(symbol, rows as any[]);
        if (result) results.push(result);
      } catch {
        errors.push(symbol);
      }
    }));
  }

  return NextResponse.json({ asOf: new Date().toISOString(), results, errors });
}
