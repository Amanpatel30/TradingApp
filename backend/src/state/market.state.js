const market = {};

const updatePrice = (symbol, data) => {
  market[symbol] = data;
};

const getPrice = (symbol) => {
  return market[symbol];
};

const getAllPrices = () => {
  return market;
};

module.exports = {
  updatePrice,
  getPrice,
  getAllPrices,
};
