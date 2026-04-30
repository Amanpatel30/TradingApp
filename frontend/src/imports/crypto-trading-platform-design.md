Update the existing CryptoSim trading platform design.

The goal is to transform the UI from a simple dashboard into a PROFESSIONAL TRADING ANALYSIS PLATFORM.

This platform must look and feel similar to:

TradingView
Binance Futures
QuantConnect
Bloomberg Terminal

The design should prioritize:

High information density
Analytical data visualization
Professional trading charts
Interactive chart components

DO NOT create marketing-style charts.
All charts must look like real trading or quantitative analysis charts.

------------------------------------------------

THEME SYSTEM

Use MIXED THEMES depending on page purpose.

Trading and chart pages → Dark theme

Analytics and dashboard pages → Light theme

This is similar to TradingView behavior.

Dark theme colors:
Background: #0B0F19
Panels: #111827
Borders: #1F2937

Light theme colors:
Background: #F7F9FC
Panels: #FFFFFF
Borders: #E5E7EB

Use Inter font.

------------------------------------------------

CHART DESIGN RULES (IMPORTANT)

All charts must be designed as INTERACTIVE components.

Charts must include:

Axis values
Grid lines
Crosshair
Hover tooltips
Data values
Legend
Multiple overlays

Do NOT use decorative curves.

Charts should resemble professional trading or quantitative analysis charts.

------------------------------------------------

DASHBOARD PAGE (LIGHT THEME)

Professional analytics dashboard.

Top metrics cards:

Portfolio Value
Net Profit
Win Rate
Profit Factor
Max Drawdown
Sharpe Ratio

Main chart:

Portfolio Equity Curve

This chart must include:

Portfolio equity line
Benchmark comparison (BTC)
Drawdown overlay
Hover tooltip showing exact values
Axis values with dollars

Right side metrics panel:

Average Win
Average Loss
Largest Win
Largest Loss
Risk per Trade
Trade Expectancy

Below create a PROFESSIONAL Monthly Returns Heatmap.

Heatmap should show percentage values inside each cell.

Below show a recent trades table.

------------------------------------------------

TRADE SIMULATOR PAGE (DARK THEME)

Professional trading terminal layout.

Left panel:

Order Book
Bid / Ask depth visualization
Price ladder

Center panel:

Interactive candlestick chart.

Chart must include:

Candlesticks
Volume bars
Price scale
Time scale
Crosshair
OHLC tooltip
Indicator overlays
Trade entry markers
Stop loss and take profit lines

Top of chart:

Asset selector
Timeframe selector

Right panel:

Order form

Fields:

Buy / Sell
Market / Limit
Position size
Stop loss
Take profit

Training context fields:

Strategy used
Confidence level slider
Trade reason input

Below chart:

Open positions
Trade history
PnL values

------------------------------------------------

REPLAY MARKET PAGE (DARK THEME)

Historical trading simulator.

Center:

Large candlestick chart.

Add playback UI:

Play
Pause
Next candle
Speed control

Top controls:

Asset selector
Year selector
Timeframe selector

Right panel:

Trade execution form.

Bottom panel:

Replay session statistics.

Metrics:

Trades taken
Session PnL
Win rate
Max drawdown

------------------------------------------------

STRATEGY BUILDER PAGE (LIGHT THEME)

No-code strategy builder.

Left side:

Condition blocks.

Examples:

RSI < 30
Price above MA200
Volume spike

Right side:

Backtest analytics panel.

Charts must include:

Equity curve
Drawdown curve
Profit distribution
Monthly returns bar chart

Each chart must include numeric axis values and tooltips.

------------------------------------------------

ANALYTICS PAGE (LIGHT THEME)

Professional trading analytics.

Charts:

Win rate over time
Profit by asset
Risk reward distribution
Drawdown curve
Equity vs benchmark

Charts must show numeric values and grid lines.

------------------------------------------------

TRADING JOURNAL PAGE (LIGHT THEME)

Detailed trade journal table.

Columns:

Date
Asset
Side
Entry
Exit
PnL
Risk Reward
Strategy
Emotion

Trades open a detailed analysis view.

------------------------------------------------

LEADERBOARD PAGE (LIGHT THEME)

Community trading leaderboard.

Columns:

Rank
Trader
Profit %
Win Rate
Trades
Strategy

Add filters:

All time
Monthly
Weekly

------------------------------------------------

IMPORTANT DESIGN RULES

Charts must look like professional trading charts.

Use dense information layout similar to professional trading platforms.

Avoid empty whitespace.

Prioritize numbers and analytical insight over visual decoration.