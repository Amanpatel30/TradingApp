const { getPortfolio } = require('../../portfolio/services/get-portfolio-service');
const { broadcastUserEvent } = require('../../../websocket/ws.server');

const emitPortfolioUpdated = async (userId, context = {}) => {
  try {
    const portfolio = await getPortfolio(userId);
    broadcastUserEvent(userId, 'portfolio_updated', {
      ...portfolio,
      ...context,
    });
  } catch (error) {
    console.error(`Failed to emit portfolio update for ${userId}:`, error.message);
  }
};

const emitUserTradingEvent = (userId, event, data = {}) => {
  broadcastUserEvent(userId, event, data);
};

module.exports = {
  emitPortfolioUpdated,
  emitUserTradingEvent,
};
