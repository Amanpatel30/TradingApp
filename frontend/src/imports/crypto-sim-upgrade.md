Upgrade the CryptoSim trading simulator platform so that it behaves like a real trading application instead of a static UI prototype.

Do NOT redesign the layout completely. Keep the current visual structure but convert every feature into a fully interactive system with realistic trading behavior.

The product should feel like a hybrid between TradingView, QuantConnect, and a professional trading journal.

---

GLOBAL APPLICATION RULES

Every interface element must represent a working feature.

No placeholder UI components are allowed.

All panels must support real data states, loading states, and empty states.

Every table must support sorting, filtering, and pagination.

Charts must support zooming, panning, and crosshair hover.

---

THEME SYSTEM

Implement a dual-theme architecture.

Trading environment pages must use DARK MODE:

Trade Simulator
Replay Market

Analytics and data pages must use LIGHT MODE:

Dashboard
Analytics
Trading Journal
Mistake Analysis
Leaderboard
Learning Center
Strategy Builder

Public pages like login or marketing should use dark gradient marketing style similar to TradingView.

---

LIVE MARKET TICKER

Upgrade the market ticker to support dynamic market data.

Each asset should display:

symbol
last price
24h change
volume
funding rate
open interest
mini sparkline chart

Assets to include:

BTC
ETH
SOL
BNB
ADA
XRP
NASDAQ
S&P500

Ticker must auto-scroll horizontally.

---

TRADE SIMULATOR

Convert the simulator into a real trading terminal.

Add full position management:

open position
partial close
close position
reduce only
modify stop loss
modify take profit
trailing stop

Add hotkey support:

B = Buy
S = Sell
C = Close position

---

ORDER BOOK

Upgrade the order book panel.

Features:

real-time bid and ask updates
best bid highlight
best ask highlight
spread indicator
depth shading

Order book rows should dynamically animate when values change.

---

TIME & SALES PANEL

Add a trade feed panel.

Display:

price
size
time
trade direction

Trades must flash green or red depending on direction.

---

POSITION VISUALIZATION

When a trade is opened, the chart must show:

entry line
stop loss line
take profit line

Highlight risk zone in red and reward zone in green.

Allow dragging SL and TP directly on the chart.

---

REPLAY MARKET

Replay mode must simulate historical market data.

Controls:

play
pause
step forward
change speed

Display trade markers on the chart:

entry marker
exit marker
mistake marker

Add a replay coach panel.

Example feedback:

Entered before breakout confirmation.

Stop loss was too tight.

Risk exceeded recommended 2%.

---

STRATEGY BUILDER

Improve strategy logic capabilities.

Allow:

AND conditions
OR conditions
nested logic
indicator parameters
multi timeframe indicators

Display strategy logic as a visual flow diagram.

---

BACKTEST ENGINE

Backtesting must generate real statistics.

Metrics:

win rate
profit factor
max drawdown
expectancy
Sharpe ratio
equity curve

Add Monte Carlo simulation.

Display probability distribution of outcomes.

---

TRADING JOURNAL

Clicking a trade should open a detailed trade review panel.

Show:

chart snapshot at entry
chart snapshot at exit
entry reasoning
emotion recorded
mistake classification

Allow replaying the trade directly from this panel.

---

MISTAKE ANALYSIS

Build a trading psychology analytics system.

Track:

early entries
FOMO trades
stop loss moved
overtrading
oversized positions

Show recoverable PnL if mistakes were eliminated.

---

LEADERBOARD

Leaderboard must rank traders by:

profit %
risk score
consistency score

Allow filters:

global
friends
weekly
monthly
all time

---

LEARNING CENTER

Convert lessons into interactive learning modules.

Features:

lesson completion tracking
quiz questions
unlock next lesson after completion
skill progress indicators

---

TRADE REVIEW SYSTEM

After each session generate automatic trade feedback.

Example:

Trade #4

Entry timing: early
Stop loss placement: correct
Exit timing: premature

Recommendation:

Wait for confirmation before breakout entries.

---

FINAL PRODUCT GOAL

The finished platform must feel like a real professional trading training system.

Every interface element should be functional and connected to real application logic.
