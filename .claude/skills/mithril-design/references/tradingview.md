# TradingView — Deep Dive (charting & trading-terminal conventions)

The modern reference for **price/time-series charting** and the multi-pane **trading terminal**. It
extends mithril's Bloomberg lineage with current web charting idioms — and charts are a stated mithril
direction. Read it when building financial terminals, candlestick/time-series charts, or any dense
multi-pane analytical charting surface.

> Chart specifics below are grounded in TradingView's **Lightweight Charts** library (Apache-2.0, open
> source) — verified defaults. The surrounding *terminal application* is proprietary, so its layout is
> treated as register (observed, not copied). See [Sources](#sources).

## 1. The chart (grounded in Lightweight Charts — verified defaults)

- **Candle semantics (universal convention — keep it):** `upColor #26a69a` (teal-green), `downColor
  #ef5350` (red); `borderVisible: false`; wicks match the body. Green = price up, red = price down.
- **Layout defaults:** background `#ffffff`, text `#191919`, font 12px system stack. Price scale on the
  **right**, time scale on the **bottom** — the financial convention; don't move them.
- **Series types:** candlestick, bar (OHLC), line, area, baseline, and **histogram** (volume). Volume
  sits in a thin pane under price.
- **Crosshair:** **magnet mode** by default (snaps to data points), thin dashed lines, paired with an
  **OHLC legend** that updates live as the pointer moves.
- **Grid:** faint horizontal/vertical lines aligned to scale marks — barely-there, so the series carries
  the chart.

**Dark-theme chart values** (from the library's dark example): background `#222`, text `#c3bcdb`, grid
`#444`, scale borders `#71649c`. Keep candle colors at `#26a69a`/`#ef5350`.

## 2. The terminal layout (register — observe-only)

The classic TradingView surface, dense and dark-default:

- **Top bar**: symbol search, interval selector (`1m 5m 15m 1h 4h 1D 1W`), chart-type toggle,
  indicators/studies, compare, layouts, alerts.
- **Left**: a vertical **drawing-tools toolbar** (trendlines, fib, shapes, measure).
- **Center**: the chart as **stacked panes sharing one time axis** — price on top, indicator studies
  (RSI, MACD, volume) in subpanes below, each with its own value scale. A **shared crosshair** spans
  every pane (same idea as Grafana's shared crosshair,
  [observability-surfaces.md](observability-surfaces.md) §7).
- **Right**: watchlist / symbol details / order book / news — tabular, monospace numerics, color-coded
  by direction.
- **Bottom**: quick time-range tabs (`1D 5D 1M 6M YTD 1Y 5Y All`) and the time axis.

## 3. Conventions that map to mithril

| Convention | Mapping |
|---|---|
| Monospace, tabular numerics in ladders/quotes | already a mithril non-negotiable |
| Shared crosshair across panes | shared with the observability register |
| Dense multi-pane tiling, dark-default | matches operator density |
| Right-side price scale, bottom time scale | domain convention — preserve |
| **Green-up / red-down candles** | **data color, NOT action intent** — see cautions |

## 4. Applying in mithril

Use **Lightweight Charts** (Apache-2.0) as the engine; theme its chrome to mithril's tokens while
keeping the domain conventions. A dark-theme options starter:

```js
const chart = LightweightCharts.createChart(el, {
  layout: { background: { color: '#1c2127' },   // mithril dark-gray-1 / bg-background
            textColor: '#abb3bf', fontSize: 12,
            fontFamily: 'system-ui, -apple-system, sans-serif' },
  grid:   { vertLines: { color: 'rgba(95,107,124,0.18)' },
            horzLines: { color: 'rgba(95,107,124,0.18)' } },
  rightPriceScale: { borderColor: 'rgba(95,107,124,0.40)' },
  timeScale:       { borderColor: 'rgba(95,107,124,0.40)' },
  crosshair: { mode: LightweightCharts.CrosshairMode.Magnet },
});
chart.addCandlestickSeries({
  upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
  wickUpColor: '#26a69a', wickDownColor: '#ef5350',   // keep the domain convention
});
```

Build the terminal shell from mithril's standard panels/rails (left rail, right inspector, top bar);
render the watchlist as a compact 24/30px-row table with monospace, tabular, direction-colored prices.

## 5. Cautions

- **Green/red here is price direction (data), not mithril's create/destroy intent.** Don't let candle
  colors and intent-button colors collide on the same surface — keep the chart's red/green out of the
  chrome's intent vocabulary, or the toolbar reads as a sea of conflicting signals.
- **Color-blind safety**: never encode direction by red/green alone — candles already carry it in
  position/shape; for derived indicators, add a non-color cue.
- **Performance**: large series need the canvas-based engine (Lightweight Charts) — don't attempt this
  with a DOM node per bar.

## Sources

- [Lightweight Charts — docs](https://tradingview.github.io/lightweight-charts/) — series, crosshair, colors, defaults
- [`tradingview/lightweight-charts` (GitHub, Apache-2.0)](https://github.com/tradingview/lightweight-charts) — default option source
- [Lightweight Charts — chart colors tutorial](https://tradingview.github.io/lightweight-charts/tutorials/customization/chart-colors) — dark-theme values
- TradingView app — terminal layout (register reference)
