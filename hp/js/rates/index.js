import currency_pairs from './config/currency_pairs.js';
import constants from './config/constants.js';

// lets call ourselves _u
const _u = _.noConflict(); 
const waitFor = 400;

const arr = [6, 7, 8, 13, 20]; // BTC ETH XRP LTC ZEC
let data_btc = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
let data_eth = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
let data_xrp = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
let data_ltc = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
let data_zec = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const arr_id = [['BTC_chart', data_btc],['ETH_chart', data_eth],['XRP_chart',data_xrp],['LTC_chart', data_ltc], ['ZEC_chart', data_zec]]  

const {
  message: {
    REQUEST_FLAG,
    ERROR_FLAG,
    REPLY_FLAG,
    EVENT_FLAG,
  },
  functions: {
    SubscribeLevel1,
  },
  WS_ENDPOINT,
  REVOLLET_FEE,
  B2B_FEE,
  currencies,
} = constants;

function setupTickers() {
  let pairs = Object.values(currency_pairs);
  let $tickers = $(".ticker-wrapper .tickers");
  currencies.forEach(currency1 => {
    currencies.forEach(currency2 => {
      if (pairs.indexOf(`${currency1}${currency2}`)===-1 && pairs.indexOf(`${currency2}${currency1}`)===-1){
        return;
      }

      let $li = $(`<li id="${currency1}${currency2}"><span class="name">${currency1}</span><span>${currency2}</span> <span class="price">0</span></li>`);
      $li.appendTo($tickers);
    })
  });
}

function setupRate() {
  Number.prototype.format = function (e, t, i, a) {
    let d = "\\d(?=(\\d{" + (t || 3) + "})+" + (0 < e ? "\\D" : "$") + ")"
      , n = this.toFixed(Math.max(0, ~~e));
    return (a ? n.replace(".", a) : n).replace(new RegExp(d, "g"), "$&" + (i || ","))
  };

  //reset rate to 0 for 8 instrument
}

const $rateTable = $("#currency__wrapper");
class B2BWsApi {
  constructor(path = WS_ENDPOINT) {
    setupTickers();
    setupRate();
    this.fiatRates = {};
    this.old_instruments = {};
    this.instruments = {};
    this.setupWs(path);
  }

  setupWs(path) {
    this.ws = new WebSocket(path);
    this.ws.addEventListener('message', data => this.processMessage(data));
    this.ws.addEventListener('open', () => this.subscribeRates());
    this.ws.addEventListener('error', message => {
      console.error(message);
    });
    this.ws.addEventListener('close', () => console.info('closed connection'));
  }

  subscribeRates() {
    Object.keys(currency_pairs).forEach(InstrumentId => {
      this.requestObject({
        name: SubscribeLevel1,
        OMSId: 1,
        InstrumentId
      });
    })
  }

  processMessage({data}) {
    data = JSON.parse(data);
    const {m: message_type, n: api_name, o: output, i: sequence_id} = data;
    switch (message_type) {
      case ERROR_FLAG:
        //todo raise error
        console.error(output);
        break;
      case EVENT_FLAG:
      case REPLY_FLAG:
        if (this[api_name]) {
          const results = JSON.parse(output);
          if (Array.isArray(results)) {
            this[api_name]({
              results,
              sequence_id
            });
          }
          else {
            this[api_name]({
              ...results,
              sequence_id
            });
          }
        }
        else {
          console.error(`[Not Implemented]${api_name}`);
        }
        break;
      default:
    }
  }

  requestObject({name, code, ...payload}) {
    this.sendWs({
      name,
      code,
      data: {
        ...payload,
      },
    })
  }

  sendWs({request_flag: m = REQUEST_FLAG, code: i = 0, name: n, data}) {
    const payload = JSON.stringify({
      m,
      i,
      n,
      o: JSON.stringify(data),
    });
    this.ws.send(payload);
  }

  SubscribeLevel1({errorcode = 0, errormsg = '', sequence_id, InstrumentId, BestBid, BestOffer, ...payload}) {
    if (errorcode > 0) {
      console.error(`[SubscribeLevel1]${sequence_id}: ${errormsg}`);
    }
    const { bidPair } = updateTicker({InstrumentId, BestBid, BestOffer});
    this.loaded+=1;
    this.updateInstruments({bidPair, BestOffer, InstrumentId, BestBid, ...payload, first_load: true});
    //below is row generator

    if (Object.keys(this.instruments).length === Object.keys(currency_pairs).length){
      for (const e of Object.keys(this.instruments)) {
        for (var i = arr.length - 1; i >= 0; i--) {
          if ( arr[i] == e ) {
            const currentBidPair=currency_pairs[e];
            const t = this.instruments[e];
            let current_element = $(".currency__item:nth-child(" + (i + 1) + ")");
            current_element.attr("data-instrument", e);
            current_element.find(".item-change")
              .attr("data-change", t.change)
              .html( 0 < t.change.toFixed(2) ? '<i class="fas fa-level-up-alt"></i> + ' + Math.abs(t.change).toFixed(2) + "%" : '<i class="fas fa-level-down-alt"></i> - ' +  Math.abs(t.change).toFixed(2) + "%")
              .addClass(0 < t.change.toFixed(2) ? "text-success text-right" : t.change.toFixed(2) < 0 ? "text-danger text-right" : "text-right")
            current_element.find(".currency_item_info").attr("data-price", t.price);
            current_element.find(".info-change").html(t.price.format(t.decimals.price, 3, ",", ".") );
            current_element.find(".info-value").html(" ≈ $" + t.fiat.format(t.decimals.fiat, 3, ",", "."));
          }
        }
      }
    }

    this.old_instruments[InstrumentId] = {
      price: this.instruments[InstrumentId].price.toFixed(this.instruments[InstrumentId].decimals.price),
      spread: this.instruments[InstrumentId].spread.toFixed(8),
      change: this.instruments[InstrumentId].change.toFixed(2),
      high: this.instruments[InstrumentId].high.toFixed(this.instruments[InstrumentId].decimals.price),
      low: this.instruments[InstrumentId].low.toFixed(this.instruments[InstrumentId].decimals.price),
      volume: this.instruments[InstrumentId].volume.toFixed(this.instruments[InstrumentId].decimals.volume)
    };
  }

  Level1UpdateEvent({errorcode = 0, errormsg = '', sequence_id, InstrumentId, BestBid, BestOffer, ...payload}) {
    if (errorcode > 0) {
      console.error(`[Level1UpdateEvent]${sequence_id}: ${errormsg}`);
    }
    const {bidPair} = updateTicker({InstrumentId, BestBid, BestOffer});
    this.updateInstrumentsDebounce({bidPair, InstrumentId, BestBid, BestOffer, ...payload});

    let a = $rateTable.find(`[data-instrument="${InstrumentId}"]`);
    let old_instruments = this.old_instruments[InstrumentId];
    let instruments = this.instruments[InstrumentId];

    old_instruments.price > instruments.price.toFixed(instruments.decimals.price) ||
    old_instruments.price < instruments.price.toFixed(instruments.decimals.price) ? a.find("[data-price]").addClass(this.old_instruments[InstrumentId].price > instruments.price.toFixed(instruments.decimals.price) ? "text-danger" : "text-success").removeClass(this.old_instruments[InstrumentId].price > instruments.price.toFixed(instruments.decimals.price) ? "text-success" : "text-danger").html(instruments.price.format(instruments.decimals.price, 3, ",", ".")).attr("data-price", instruments.price).append($("<span/>", {
      text: " ≈ $" + instruments.fiat.format(instruments.decimals.fiat, 3, ",", ".")
    })) : a.removeClass("text-success").removeClass("text-danger").find("[data-price] span").text(" ≈ $" + instruments.fiat.format(instruments.decimals.fiat, 3, ",", ".")),
    old_instruments.spread !== instruments.spread.toFixed(8) && a.find("[data-spread]").attr("data-spread", instruments.spread).html(instruments.spread.toFixed(8)),
    old_instruments.change === instruments.change.toFixed(2) && 0 !== instruments.change || (instruments.change.toFixed(2) < 0 ? a.find("[data-change]").addClass("text-danger").removeClass("text-success").html(Math.abs(instruments.change).toFixed(2) + "%").attr("data-change", instruments.change) : 0 < instruments.change.toFixed(instruments.decimals.price) ? a.find("[data-change]").addClass("text-success").removeClass("text-danger").html(Math.abs(instruments.change).toFixed(2) + "%").attr("data-change", instruments.change) : a.find("[data-change]").removeClass("text-success").removeClass("text-danger").data("change", instruments.change).html("0%")),
    old_instruments.high !== instruments.high.toFixed(instruments.decimals.price) && a.find("[data-high]").attr("data-high", instruments.high).html(instruments.high.format(instruments.decimals.price, 3, ",", ".")),
    old_instruments.low !== instruments.low.toFixed(instruments.decimals.price) && a.find("[data-low]").attr("data-low", instruments.low).html(instruments.low.format(instruments.decimals.price, 3, ",", ".")),
    old_instruments.volume !== instruments.volume.toFixed(instruments.decimals.volume) && a.find("[data-volume]").attr("data-volume", instruments.volume).html(instruments.volume.format(instruments.decimals.volume, 3, ",", "."));

    old_instruments = {
      price: instruments.price.toFixed(instruments.decimals.price),
      spread: instruments.spread.toFixed(8),
      change: instruments.change.toFixed(2),
      high: instruments.high.toFixed(instruments.decimals.price),
      low: instruments.low.toFixed(instruments.decimals.price),
      volume: instruments.volume.toFixed(instruments.decimals.volume)
    }

    // const arr = [6, 7, 8, 13, 20]; // BTC ETH XRP LTC ZEC
    switch(InstrumentId) {
      case 6:
          let ctx_btc = document.getElementById("BTC_chart").getContext("2d");
          setDataCurrency(data_btc, instruments.price.toFixed(instruments.decimals.price));
          initChart(data_btc, ctx_btc);
        break;
      case 7:
          let ctx_eth = document.getElementById("ETH_chart").getContext("2d");
          setDataCurrency(data_eth, instruments.price.toFixed(instruments.decimals.price));
          initChart(data_eth, ctx_eth);
        break;
      case 8:
          let ctx_xrp = document.getElementById("XRP_chart").getContext("2d");
          setDataCurrency(data_xrp, instruments.price.toFixed(instruments.decimals.price));
          initChart(data_xrp, ctx_xrp);
        
        break;
      case 13:
          let ctx_ltc = document.getElementById("LTC_chart").getContext("2d");
          setDataCurrency(data_ltc, instruments.price.toFixed(instruments.decimals.price));
          initChart(data_ltc, ctx_ltc);
        
        break;
      case 20:
          let ctx_zec = document.getElementById("ZEC_chart").getContext("2d");
          setDataCurrency(data_ltc, instruments.price.toFixed(instruments.decimals.price));
          initChart(data_ltc, ctx_zec);
        
        break;
      default:
        return;
    }
  }

  updateInstruments({bidPair, BestBid, BestOffer, InstrumentId, LastTradedPx, Rolling24HrPxChange, SessionHigh, SessionLow, Rolling24HrVolume, first_load=false}) {
    let bidPair_Symbol2 = getSymbol2(bidPair);
    if (bidPair_Symbol2==='USDT') {
      this.fiatRates[getSymbol1(bidPair)] = {
        fiat: LastTradedPx
      };
    }

    this.instruments[InstrumentId] = {
      price: LastTradedPx,
      fiat: 0,
      spread: BestOffer - BestBid,
      change: Rolling24HrPxChange,
      high: SessionHigh,
      low: SessionLow,
      volume: Rolling24HrVolume,
      decimals: {
        price: 0,
        volume: 0,
        fiat: 0,
      }
    };

    if (this.instruments[InstrumentId].price < 10){
      this.instruments[InstrumentId].decimals.price = 6
    } else if (this.instruments[InstrumentId].price < 100){
      this.instruments[InstrumentId].decimals.price = 5
    } else if (this.instruments[InstrumentId].price < 1e3){
      this.instruments[InstrumentId].decimals.price = 4
    } else {
      this.instruments[InstrumentId].decimals.price = 2;
    }
    if (this.instruments[InstrumentId].volume < 10) {
      this.instruments[InstrumentId].decimals.volume = 5
    } else if (this.instruments[InstrumentId].volume < 100) {
      this.instruments[InstrumentId].decimals.volume = 4
    } else if (this.instruments[InstrumentId].volume < 1e3){
      this.instruments[InstrumentId].decimals.volume = 3
    } else {
      this.instruments[InstrumentId].decimals.volume = 2;
    }

    if (this.loaded === Object.keys(currency_pairs).length || !first_load){
      for (const e of Object.keys(this.instruments)) {
        let currentBidPair = currency_pairs[e];
        let symbol2 = getSymbol2(currentBidPair);
        this.instruments[e].fiat = symbol2==='USDT'? this.instruments[e].price : this.instruments[e].price * this.fiatRates[symbol2].fiat;
        if (this.instruments[e].fiat < 10) {
          this.instruments[e].decimals.fiat = 4
        }
        else if (this.instruments[e].fiat < 100) {
          this.instruments[e].decimals.fiat = 3
        }
        else {
          this.instruments[e].decimals.fiat = 2
        }

      }
    }
  }
  updateInstrumentsDebounce(obj){
    return _u.wrap(
      _u.memoize(
        () => _u.debounce( this.updateInstruments, waitFor).bind(this),
        _u.property('InstrumentId')
      ),
      (func, obj)=>func(obj)(obj)
    )(obj);
  }
}

function properPrice(origin) {
  return origin * (1 - B2B_FEE) * (1 - REVOLLET_FEE);
}

function getAskPair(bidPair) {
  let left = getSymbol1(bidPair);
  let right = getSymbol2(bidPair);
  return right + left;
}

function getSymbol1(pair) {
  if (pair.indexOf('NADM')===0){
    return 'NADM'
  }
  else {
    return pair.substring(0, 3);
  }
}

function getSymbol2(pair) {
  if (pair.indexOf('NADM')===0){
    return pair.substring(4);
  }
  else {
    return pair.substring(3);
  }
}
function beautyPair(pair){
  return `${getSymbol1(pair)}/${getSymbol2(pair)}`
}

function updateTicker({InstrumentId, BestBid, BestOffer}) {

  //calc bid field
  let bidPair = currency_pairs[InstrumentId];
  let $instrument  = $(`#${bidPair}`);
  let $bidEl = $instrument.find('.price');
  const bidVal = properPrice(BestBid);
  $bidEl.text(bidVal.toFixed(6));

  //calc ask
  let askPair = getAskPair(bidPair);
  let $ask_instrument = $(`#${askPair}`);
  let $askEl = $ask_instrument.find('.price');
  const newAskVal = properPrice(1 / BestOffer);
  $askEl.text(newAskVal.toFixed(6));
  return {bidPair, bidVal};
}

// Config chart 
const options = {
  animation: false,
  scaleOverride: true,
  scaleSteps: 10,
  scaleStepWidth: 10,
  scaleStartValue: 0,
  elements: {
    line: {
      tension: 0
    }
  },
  legend: {
    display: false,
  },
  tooltips: {
    callbacks: {
      label: function(tooltipItem) {
        return tooltipItem.yLabel;
      }
    }
  },
  scales: {
    yAxes: [{
      ticks: {
        // Include a dollar sign in the ticks
        beginAtZero: true,
        display: false,
        stepSize: 2
      },
      gridLines: {
        display: false
      }
    }],
    xAxes: [{
      ticks: {
        display: false //this will remove only the label
      },
      gridLines: {
        display: false
      }
    }]
  }
}
function initChart(data, ctx) {
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      datasets: [{
        label: '# of BTC',
        data: data,
        backgroundColor: ['rgba(131, 70, 255, .2)'],
        borderColor: [
          'rgba(131, 70, 255, 1)'
        ],
        borderWidth: 1,
      }]
    },
    options: options
  });
  
}
function setDataCurrency(data, newValue) {
  data.push(newValue);
  data.shift();
}

// init B2BWS - Get streaming
new B2BWsApi();

// init chart
for (var i = 0; i < arr_id.length; i++) {    
  let ctx = document.getElementById(arr_id[i][0]).getContext("2d");
  initChart(arr_id[i][1], ctx);
}
