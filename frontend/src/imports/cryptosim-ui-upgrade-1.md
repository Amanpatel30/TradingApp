Upgrade the existing CryptoSim trading training platform UI.

IMPORTANT:
Do NOT redesign the entire platform from scratch.
Keep the current layout, navigation structure, and overall visual identity.

The goal is to upgrade the product so it feels like a professional trading platform similar to:

TradingView
QuantConnect
Bybit
LuxAlgo

Focus on improving professional trading features, learning tools, and interface clarity.

--------------------------------------------------

GLOBAL DESIGN SYSTEM

Implement a dual-theme system inspired by TradingView.

1. Trading Interface Theme

All trading-related pages should use DARK MODE.

Pages using dark theme:

Trade Simulator
Replay Market
Strategy Builder

Dark theme colors:

Background: #0B0F19
Panels: #111827
Borders: #1F2937
Positive: #22C55E
Negative: #EF4444

Charts must use professional trading styling with subtle grid lines and crosshair hover.

--------------------------------------------------

2. Analytics and Management Pages

These pages should use LIGHT MODE.

Dashboard
Analytics
Trading Journal
Leaderboard
Mistake Analysis
Learning Center

Background: #F8FAFC
Cards: white
Borders: #E5E7EB

--------------------------------------------------

3. Informational Pages

Public informational pages such as:

Home
About
Features
Pricing

Should use DARK MARKETING STYLE similar to TradingView marketing pages.

Dark gradient backgrounds and strong contrast typography.

--------------------------------------------------

TOP GLOBAL MARKET BAR

Upgrade the scrolling market ticker at the top.

Instead of only showing price and percentage change, include additional trading metrics.

Example ticker item:

BTC $67,542  +4.82%
Vol $42B
OI +3.1%
Funding 0.01%

Add these assets:

BTC
ETH
SOL
BNB
ADA
XRP
NASDAQ
S&P 500

Include mini sparkline charts for each asset.

--------------------------------------------------

DASHBOARD IMPROVEMENTS

Add a new widget called:

Last Trading Session

This widget should display:

Trades taken
Win rate
Session PnL
Number of mistakes
Main mistake type

Example:

Last Session
Trades: 12
Win Rate: 66%
PnL: +$1,840
Mistakes: 3
Main Issue: Early Entries

This connects the dashboard with the training system.

--------------------------------------------------

TRADE SIMULATOR IMPROVEMENTS

Upgrade the simulator into a more realistic trading terminal.

Add these professional trading components.

--------------------------------------------------

Order Book Panel

Add a collapsible panel showing order book depth.

Columns:

Price
Bid Size
Ask Size

Highlight best bid and best ask.

--------------------------------------------------

Time & Sales Panel

Add a live trade feed panel.

Columns:

Price
Size
Time

Trades should flash green/red depending on direction.

--------------------------------------------------

Position Visualization

When a user opens a trade, show the trade visually on the chart.

Display:

Entry line
Stop loss line
Take profit line

Shade risk zone (red) and reward zone (green).

--------------------------------------------------

Enhanced Position Panel

Upgrade the open position panel to display:

Position size
Entry price
Mark price
Unrealized PnL
Leverage
Liquidation price

--------------------------------------------------

REPLAY MARKET IMPROVEMENTS

Replay mode should feel like a training environment.

Add mistake markers directly on the chart timeline.

Examples:

⚠ Early Entry
⚠ Overtrading
⚠ Stop moved

Add a new panel called:

Replay Coach

Example feedback:

Trade 1:
Entered before breakout confirmation.

Trade 2:
Risk per trade exceeded 2%.

Trade 3:
Stop loss too tight.

--------------------------------------------------

STRATEGY BUILDER IMPROVEMENTS

Convert strategy conditions into a visual flow diagram.

Example:

RSI < 30
↓
Price > MA200
↓
Volume Spike
↓
BUY

Display these conditions as connected blocks in a vertical flow.

--------------------------------------------------

Add Monte Carlo Simulation Panel

Allow stress testing strategies using randomized market conditions.

Display results such as:

Worst case drawdown
Probability of loss
Expected return distribution

--------------------------------------------------

ANALYTICS PAGE IMPROVEMENTS

Add a new chart:

Expectancy Over Time

Formula:

Expectancy = (Win rate × Avg win) − (Loss rate × Avg loss)

Display how expectancy evolves across trading sessions.

--------------------------------------------------

TRADING JOURNAL IMPROVEMENTS

Enable clicking any trade to open a detailed trade review panel.

This panel should display:

Chart snapshot at entry
Chart snapshot at exit
Entry reasoning
Emotion recorded
Mistake analysis

--------------------------------------------------

LEADERBOARD IMPROVEMENTS

Make the leaderboard more educational.

Add new columns:

Strategy used
Risk management score
Consistency score

Allow filtering by:

Global
Friends
Monthly
Weekly

--------------------------------------------------

MISTAKE ANALYSIS IMPROVEMENTS

Add a feature called:

Recovery Simulation

Example output:

If you eliminated these mistakes:

Overtrading
FOMO entries

Your PnL would increase from:

+$5,390 → +$8,240

Visualize recoverable losses.

--------------------------------------------------

LEARNING CENTER IMPROVEMENTS

Introduce structured learning paths.

Examples:

Beginner Trader Path
Intermediate Strategy Builder
Advanced Quant Trading

Each path should contain sequential lessons with progress tracking.

--------------------------------------------------

AUTHENTICATION PAGE IMPROVEMENTS

Remove fake statistics such as:

"Join 183,000 traders"

Replace with real value propositions:

Practice trading risk-free
Replay historical markets
Analyze your trading mistakes
Build and test strategies

--------------------------------------------------

CONSISTENCY IMPROVEMENTS

Ensure consistent component design across the platform.

Standardize:

Card radius
Button sizes
Chart tooltips
Hover states
Spacing grid

All charts should support:

Crosshair hover
Tooltips
Axis labels
Grid lines

--------------------------------------------------

PRODUCT GOAL

The final platform should feel like a hybrid between:

TradingView
QuantConnect
LuxAlgo

A professional trading training platform focused on skill improvement.