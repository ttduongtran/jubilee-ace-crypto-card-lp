const message = {
    REQUEST_FLAG: 0,
    REPLY_FLAG: 1,
    SUBSCRIBE_EVENT_FLAG: 2,
    EVENT_FLAG: 3,
    UNSUBSCRIBE_EVENT_FLAG: 4,
    ERROR_FLAG: 5
};
const functions = {
  SubscribeLevel1: 'SubscribeLevel1',
  UnsubscribeLevel1: 'UnsubscribeLevel1',
};

export default {
  message,
  functions,
  WS_ENDPOINT: 'wss://wss.revex.pro/WSGateway',
  currencies: ['BTC','ETH', 'BCH', 'USDT', 'XRP', 'XGT', 'ADA', 'NADM', 'LTC', 'XEM', 'ZEC', 'XLM', 'ZEC'],
  B2B_FEE: 0.002,
  REVOLLET_FEE: 0.05,
}
