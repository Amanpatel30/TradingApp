let socket = null;
let authToken = null;
let reconnectTimer = null;
let shouldReconnect = false;
const listeners = new Set();
const subscribedSymbols = new Set();

function getRealtimeUrl() {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.hostname || "localhost";
  const port = window.location.port === "5173" ? "3000" : window.location.port || "3000";
  return `${protocol}://${host}:${port}`;
}

function notifyListeners(message) {
  listeners.forEach((listener) => {
    try {
      listener(message);
    } catch (error) {
      console.error("Realtime listener failed", error);
    }
  });
}

function send(message) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function scheduleReconnect() {
  if (!shouldReconnect || reconnectTimer) {
    return;
  }

  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    connectRealtime(authToken);
  }, 2000);
}

export function connectRealtime(token) {
  authToken = token || null;
  shouldReconnect = Boolean(token);

  if (!token) {
    disconnectRealtime();
    return null;
  }

  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return socket;
  }

  socket = new WebSocket(getRealtimeUrl());

  socket.addEventListener("open", () => {
    send({ event: "authenticate", token: authToken });
    subscribedSymbols.forEach((symbol) => {
      send({ event: "subscribe", symbol });
    });
  });

  socket.addEventListener("message", (event) => {
    try {
      notifyListeners(JSON.parse(event.data));
    } catch (error) {
      console.error("Failed to parse realtime message", error);
    }
  });

  socket.addEventListener("close", () => {
    notifyListeners({ event: "socket_closed", data: {} });
    socket = null;
    scheduleReconnect();
  });

  socket.addEventListener("error", () => {
    notifyListeners({ event: "socket_error", data: {} });
  });

  return socket;
}

export function disconnectRealtime() {
  shouldReconnect = false;
  if (reconnectTimer) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (socket) {
    socket.close();
    socket = null;
  }
}

export function subscribeRealtimeSymbol(symbol) {
  const normalized = String(symbol || "").replace("/", "").toUpperCase();
  if (!normalized) {
    return () => {};
  }

  subscribedSymbols.add(normalized);
  send({ event: "subscribe", symbol: normalized });

  return () => unsubscribeRealtimeSymbol(normalized);
}

export function unsubscribeRealtimeSymbol(symbol) {
  const normalized = String(symbol || "").replace("/", "").toUpperCase();
  if (!normalized) {
    return;
  }

  subscribedSymbols.delete(normalized);
  send({ event: "unsubscribe", symbol: normalized });
}

export function addRealtimeListener(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
