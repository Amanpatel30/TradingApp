const http = require('http');
const WebSocket = require('ws');
const { initWebSocketServer, closeWebSocketServer } = require('../../src/websocket/ws.server');

const createWebSocketHarness = async () => {
  const server = http.createServer((req, res) => {
    res.writeHead(404);
    res.end();
  });

  initWebSocketServer(server);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  const close = async () => {
    closeWebSocketServer();
    await new Promise((resolve) => server.close(resolve));
  };

  return {
    url: `ws://127.0.0.1:${port}`,
    close,
  };
};

const connectClient = (url) =>
  new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });

const nextMessage = (ws, predicate = () => true, timeoutMs = 1500) =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.off('message', onMessage);
      reject(new Error('Timed out waiting for websocket message'));
    }, timeoutMs);

    const onMessage = (raw) => {
      const message = JSON.parse(raw.toString());
      if (!predicate(message)) {
        return;
      }

      clearTimeout(timeout);
      ws.off('message', onMessage);
      resolve(message);
    };

    ws.on('message', onMessage);
  });

module.exports = {
  connectClient,
  createWebSocketHarness,
  nextMessage,
};
