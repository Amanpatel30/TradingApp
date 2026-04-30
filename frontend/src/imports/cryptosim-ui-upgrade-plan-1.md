Upgrade the existing CryptoSim trading training platform UI.

Do NOT redesign the whole platform.
Keep the current structure and layout but improve it to look more like a professional trading platform.

The goal is to make the UI feel closer to:

TradingView
Binance
Bybit
QuantConnect

Focus on improving information density, professional trading tools, and training features.

------------------------------------

GLOBAL DESIGN IMPROVEMENTS

1. Improve data density across the platform.

Add more professional trading information such as:

• Price change %
• Volume
• Spread
• Market depth
• Session stats
• Risk metrics

Avoid empty whitespace in trading pages.

------------------------------------

TOP GLOBAL MARKET BAR

Upgrade the market ticker bar at the top.

Instead of only showing BTC, ETH, SOL:

Add scrolling market ticker:

BTC / ETH / SOL / BNB / ADA / XRP / NASDAQ / S&P 500

Each should display:

price
24h %
mini sparkline

This should look like a real trading terminal market ticker.

------------------------------------

TRADE SIMULATOR PAGE IMPROVEMENTS

Upgrade the simulator into a full trading terminal.

Add these components:

1. Indicator toolbar above chart

Add buttons:

Indicators
Drawing tools
Compare asset
Reset chart

2. Indicator panel

Allow adding indicators such as:

RSI
MACD
Moving averages
Volume profile

Display indicators under the chart.

3. Trade markers on chart

When a trade is placed:

Show entry arrow
Show stop loss line
Show take profit line

4. Risk calculator

Next to the order form show:

Risk per trade
Position size
Potential loss
Potential profit

------------------------------------

REPLAY MARKET PAGE IMPROVEMENTS

Upgrade replay training mode.

Add:

Session progress bar
Trade markers on replay chart
Mistake highlights

Add a new panel:

Replay feedback

Examples:

You entered before confirmation
Stop loss too tight
Risk too high

------------------------------------

STRATEGY BUILDER IMPROVEMENTS

Upgrade strategy builder to look more like a professional quant tool.

Add:

Strategy flow visualization

Example:

ENTRY
RSI < 30
AND
Price > MA200

THEN
Buy

Show this as connected blocks.

Add new panels:

Strategy performance distribution
Trade duration distribution
Drawdown timeline

------------------------------------

ANALYTICS PAGE IMPROVEMENTS

Add more advanced analytics.

New charts:

Profit by weekday
Trade duration vs profit
Strategy performance comparison
Equity volatility chart

------------------------------------

TRADING JOURNAL IMPROVEMENTS

Add a detailed trade analysis view.

When a trade is clicked:

Show:

Trade chart snapshot
Entry reason
Mistake analysis
Risk management score

Add:

Emotion tracking chart.

------------------------------------

LEADERBOARD IMPROVEMENTS

Upgrade leaderboard to encourage competition.

Add:

Trader profile preview
Strategy used
Risk score
Consistency score

Add new tab:

Friends leaderboard.

------------------------------------

NEW PAGE: MISTAKE ANALYSIS

Add a new page in the sidebar:

Mistake Analysis

Show:

Most common mistakes
Average stop loss size
Overtrading frequency
Risk violations

Show charts highlighting these mistakes.

------------------------------------

NEW PAGE: LEARNING CENTER

Add a new page:

Learning Center

Include:

Trading concepts
Strategy tutorials
Risk management lessons
Platform usage guides

------------------------------------

VISUAL DESIGN IMPROVEMENTS

Improve the platform to look more premium.

Upgrade:

chart toolbars
hover states
active states
table density
chart gridlines

Charts should look like real trading charts with:

axis values
tooltips
crosshair
hover indicators

------------------------------------

IMPORTANT

Do NOT simplify the interface.

The platform should feel powerful and professional like a real trading terminal.