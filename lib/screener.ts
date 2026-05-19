export type Candle = { date: Date; open: number; high: number; low: number; close: number; volume: number };
export type ScreenResult = {
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

const sma = (v: number[], n: number) => v.length < n ? NaN : v.slice(-n).reduce((a,b)=>a+b,0) / n;
const highN = (v: number[], n: number) => Math.max(...v.slice(-n));
const lowN = (v: number[], n: number) => Math.min(...v.slice(-n));

function atr(c: Candle[], n = 14) {
  if (c.length < n + 1) return NaN;
  const tr: number[] = [];
  for (let i = 1; i < c.length; i++) {
    tr.push(Math.max(c[i].high - c[i].low, Math.abs(c[i].high - c[i-1].close), Math.abs(c[i].low - c[i-1].close)));
  }
  return sma(tr, n);
}

export function screenTicker(symbol: string, candles: Candle[]): ScreenResult | null {
  const c = candles.filter(x => x.close && x.high && x.low && x.volume).sort((a,b) => +new Date(a.date) - +new Date(b.date));
  if (c.length < 252) return null;
  const closes = c.map(x => x.close), vols = c.map(x => x.volume);
  const last = c[c.length - 1], prev = c[c.length - 2], weekAgo = c[c.length - 6] ?? c[0];
  const ma50 = sma(closes, 50), ma150 = sma(closes, 150), ma200 = sma(closes, 200);
  const ma200_20Ago = c.length > 220 ? sma(closes.slice(0, -20), 200) : NaN;
  const atr14 = atr(c, 14);
  if (!isFinite(ma50) || !isFinite(atr14) || ma50 <= 0) return null;

  const dailyPct = ((last.close / prev.close) - 1) * 100;
  const weeklyPct = ((last.close / weekAgo.close) - 1) * 100;
  const avgVol50 = sma(vols, 50);
  const dollarVolume = avgVol50 * last.close;
  const high52 = highN(closes, 252), low52 = lowN(closes, 252);
  const atrExtension = Math.abs(last.close - ma50) / atr14;
  if (atrExtension >= 5) return null;

  const minervini = last.close > ma50 && ma50 > ma150 && ma150 > ma200 && ma200 > ma200_20Ago && last.close >= 1.3 * low52 && last.close >= 0.75 * high52;
  const stockbee9m = dollarVolume >= 9_000_000 && dailyPct > 0;
  const stockbee20w = weeklyPct >= 20;
  const stockbee4d = dailyPct >= 4;
  const qullamaggie = minervini && stockbee4d && last.close >= highN(closes.slice(0, -1), 20) * 0.98 && last.volume >= 1.5 * avgVol50;

  const tags = { qullamaggie, minervini, stockbee9m, stockbee20w, stockbee4d };
  const score = Object.values(tags).filter(Boolean).length;
  if (!score) return null;

  return { symbol, close: last.close, dailyPct, weeklyPct, atrExtension, dollarVolume, score, tags };
}
