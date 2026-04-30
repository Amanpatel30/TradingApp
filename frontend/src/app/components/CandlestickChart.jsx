import { useEffect, useMemo, useRef, useState } from "react";

const CHART_PADDING = { top: 20, right: 70, bottom: 40, left: 10 };

function getChartTheme(theme) {
  const isDark = theme === "dark";

  return {
    background: isDark ? "#111827" : "#FFFFFF",
    grid: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    text: isDark ? "#64748B" : "#94A3B8",
    up: "#26A69A",
    down: "#EF5350",
    crosshair: isDark ? "rgba(148,163,184,0.45)" : "rgba(71,85,105,0.35)",
    hoverFill: isDark ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.06)",
    tooltipBackground: isDark ? "rgba(15,23,42,0.94)" : "rgba(255,255,255,0.96)",
    tooltipBorder: isDark ? "rgba(148,163,184,0.18)" : "rgba(148,163,184,0.24)",
    tooltipText: isDark ? "#E2E8F0" : "#0F172A",
    tooltipMuted: isDark ? "#94A3B8" : "#64748B",
  };
}

function formatAxisPrice(value) {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }

  return `$${value.toFixed(2)}`;
}

function formatTooltipPrice(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatTooltipVolume(value) {
  if (value == null) {
    return "—";
  }

  const numeric = Number(value);

  if (numeric >= 1_000_000) {
    return `${(numeric / 1_000_000).toFixed(2)}M`;
  }

  if (numeric >= 1_000) {
    return `${(numeric / 1_000).toFixed(1)}K`;
  }

  return numeric.toFixed(0);
}

/**
 * Candle shape: { open, high, low, close, time, volume? }
 */
export function CandlestickChart({ candles, height = 400, theme = "dark" }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(
    typeof height === "number" ? height : 0,
  );
  const palette = useMemo(() => getChartTheme(theme), [theme]);
  const resolvedHeight =
    height === "fill" ? Math.max(320, containerHeight || 0) : height;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const updateSize = () => {
      setChartWidth(container.clientWidth || 800);
      if (height === "fill") {
        setContainerHeight(container.clientHeight || 0);
      }
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [height]);

  const geometry = useMemo(() => {
    const width = chartWidth || 800;
    const chartWidthInner = width - CHART_PADDING.left - CHART_PADDING.right;
    const chartHeightInner = resolvedHeight - CHART_PADDING.top - CHART_PADDING.bottom;
    const maxPrice = candles.length ? Math.max(...candles.map((candle) => candle.high)) : 1;
    const minPrice = candles.length ? Math.min(...candles.map((candle) => candle.low)) : 0;
    const priceRange = Math.max(maxPrice - minPrice, maxPrice * 0.01 || 1);
    const pricePadding = priceRange * 0.05;
    const visibleMin = minPrice - pricePadding;
    const visibleMax = maxPrice + pricePadding;
    const spacing = candles.length ? chartWidthInner / candles.length : chartWidthInner;
    const candleWidth = candles.length
      ? Math.max(3, Math.min(14, chartWidthInner / candles.length - 2))
      : 6;

    return {
      width,
      chartWidth: chartWidthInner,
      chartHeight: chartHeightInner,
      visibleMin,
      visibleMax,
      spacing,
      candleWidth,
      toY(price) {
        return (
          CHART_PADDING.top +
          chartHeightInner -
          ((price - visibleMin) / Math.max(visibleMax - visibleMin, 1)) * chartHeightInner
        );
      },
      toX(index) {
        return CHART_PADDING.left + spacing * index + spacing / 2;
      },
    };
  }, [candles, chartWidth, resolvedHeight]);

  const activeIndex =
    hoverIndex == null || !candles.length
      ? null
      : Math.max(0, Math.min(candles.length - 1, hoverIndex));
  const activeCandle = activeIndex == null ? null : candles[activeIndex];

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = geometry.width * devicePixelRatio;
    canvas.height = resolvedHeight * devicePixelRatio;
    canvas.style.width = `${geometry.width}px`;
    canvas.style.height = `${resolvedHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, geometry.width, resolvedHeight);

    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, geometry.width, resolvedHeight);

    if (!candles.length) {
      ctx.fillStyle = palette.text;
      ctx.font = "12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("No chart data available", geometry.width / 2, resolvedHeight / 2);
      return;
    }

    if (activeIndex != null) {
      const activeX = geometry.toX(activeIndex);
      ctx.fillStyle = palette.hoverFill;
      ctx.fillRect(
        activeX - geometry.spacing / 2,
        CHART_PADDING.top,
        geometry.spacing,
        geometry.chartHeight,
      );
    }

    const gridCount = 6;
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;

    for (let index = 0; index <= gridCount; index += 1) {
      const y = CHART_PADDING.top + (geometry.chartHeight / gridCount) * index;
      ctx.beginPath();
      ctx.moveTo(CHART_PADDING.left, y);
      ctx.lineTo(geometry.width - CHART_PADDING.right, y);
      ctx.stroke();

      const price =
        geometry.visibleMax -
        ((geometry.visibleMax - geometry.visibleMin) / gridCount) * index;
      ctx.fillStyle = palette.text;
      ctx.font = "10px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(formatAxisPrice(price), geometry.width - CHART_PADDING.right + 6, y + 4);
    }

    candles.forEach((candle, index) => {
      const x = geometry.toX(index);
      const isUp = candle.close >= candle.open;
      const color = isUp ? palette.up : palette.down;

      const openY = geometry.toY(candle.open);
      const closeY = geometry.toY(candle.close);
      const highY = geometry.toY(candle.high);
      const lowY = geometry.toY(candle.low);

      ctx.strokeStyle = color;
      ctx.lineWidth = activeIndex === index ? 1.4 : 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(1, Math.abs(openY - closeY));
      ctx.fillStyle = color;
      ctx.fillRect(x - geometry.candleWidth / 2, bodyTop, geometry.candleWidth, bodyHeight);

      if (activeIndex === index) {
        ctx.strokeStyle = isUp ? "rgba(34,197,94,0.65)" : "rgba(239,68,68,0.65)";
        ctx.strokeRect(
          x - geometry.candleWidth / 2 - 1,
          bodyTop - 1,
          geometry.candleWidth + 2,
          bodyHeight + 2,
        );
      }
    });

    const labelInterval = Math.ceil(candles.length / 8);
    ctx.fillStyle = palette.text;
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";

    candles.forEach((candle, index) => {
      if (index % labelInterval === 0) {
        ctx.fillText(candle.time, geometry.toX(index), resolvedHeight - 8);
      }
    });

    if (activeCandle && activeIndex != null) {
      const activeX = geometry.toX(activeIndex);
      const activeY = geometry.toY(activeCandle.close);

      ctx.strokeStyle = palette.crosshair;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(activeX, CHART_PADDING.top);
      ctx.lineTo(activeX, resolvedHeight - CHART_PADDING.bottom);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(CHART_PADDING.left, activeY);
      ctx.lineTo(geometry.width - CHART_PADDING.right, activeY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [activeCandle, activeIndex, candles, geometry, palette, resolvedHeight]);

  const handlePointerMove = (event) => {
    if (!candles.length) {
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (
      x < CHART_PADDING.left ||
      x > geometry.width - CHART_PADDING.right ||
      y < CHART_PADDING.top ||
      y > resolvedHeight - CHART_PADDING.bottom
    ) {
      setHoverIndex(null);
      return;
    }

    const nextIndex = Math.floor((x - CHART_PADDING.left) / Math.max(geometry.spacing, 1));
    setHoverIndex(nextIndex);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  const tooltipPosition = activeIndex != null && activeIndex > candles.length / 2
    ? { right: 12 }
    : { left: 12 };

  return (
    <div
      ref={containerRef}
      data-testid="candlestick-chart"
      style={{
        width: "100%",
        height: height === "fill" ? "100%" : resolvedHeight,
        position: "relative",
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: resolvedHeight }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
      />

      {activeCandle ? (
        <div
          data-testid="candlestick-tooltip"
          style={{
            position: "absolute",
            top: 12,
            ...tooltipPosition,
            padding: "10px 12px",
            borderRadius: 12,
            background: palette.tooltipBackground,
            border: `1px solid ${palette.tooltipBorder}`,
            boxShadow: theme === "dark" ? "0 18px 48px rgba(0,0,0,0.36)" : "0 12px 32px rgba(15,23,42,0.12)",
            backdropFilter: "blur(10px)",
            minWidth: 176,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              color: palette.tooltipMuted,
              fontSize: "0.7rem",
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            {activeCandle.time}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 8,
            }}
          >
            {[
              ["Open", formatTooltipPrice(activeCandle.open)],
              ["High", formatTooltipPrice(activeCandle.high)],
              ["Low", formatTooltipPrice(activeCandle.low)],
              ["Close", formatTooltipPrice(activeCandle.close)],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ color: palette.tooltipMuted, fontSize: "0.66rem" }}>{label}</div>
                <div style={{ color: palette.tooltipText, fontWeight: 700, fontSize: "0.76rem" }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: `1px solid ${palette.tooltipBorder}`,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <span style={{ color: palette.tooltipMuted, fontSize: "0.66rem" }}>Volume</span>
            <span style={{ color: palette.tooltipText, fontSize: "0.7rem", fontWeight: 700 }}>
              {formatTooltipVolume(activeCandle.volume)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
