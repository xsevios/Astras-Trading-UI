import * as LightweightCharts from 'lightweight-charts';
import { Observable } from 'rxjs';
import { distinct, filter, map } from 'rxjs/operators';
import { LightChartSettings } from 'src/app/shared/models/settings/light-chart-settings.model';
import { Candle } from '../../../shared/models/history/candle.model';
import { TimeframesHelper } from './timeframes-helper';
import { buyColor, sellColor, buyColorBackground, sellColorBackground, componentBackgound } from '../../../shared/models/settings/styles-constants'

export class LightChart {
  chart!: LightweightCharts.IChartApi;
  series!: LightweightCharts.ISeriesApi<'Candlestick'>;
  volumeSeries!: LightweightCharts.ISeriesApi<'Histogram'>;

  logicalRange$!: Observable<unknown>;

  private bars: Candle[] = [];
  private getMinTime = () => Math.min(...this.bars.map(b => b.time));
  private timeframesHelper = new TimeframesHelper()
  private sizes: {
    width: number,
    height: number
  };
  constructor(width: number, height: number) {
    this.sizes = {
      width: width,
      height: height - 30
    };
  }

  create(guid: string) {
    const chart = LightweightCharts.createChart(guid, {
      width: this.sizes.width,
      height: this.sizes.height,
      timeScale: {
        timeVisible: true,
        borderColor: '#D1D4DC',
      },
      rightPriceScale: {
        borderColor: '#D1D4DC',
      },
      layout: {
        backgroundColor: componentBackgound, // '#ffffff',
        textColor: '#fff',
      },
      grid: {
        horzLines: {
          color: '#444', // '#F0F3FA',
        },
        vertLines: {
          color: '#444', // '#F0F3FA',
        },
      },
    });
    var series = chart.addCandlestickSeries({
      upColor: buyColor, // 'rgb(38,166,154)',
      downColor: sellColor,// 'rgb(255,82,82)',
      wickUpColor: buyColorBackground, // 'rgb(38,166,154)',
      wickDownColor: sellColorBackground, // 'rgb(255,82,82)',
      borderVisible: false,
    });
    var volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    volumeSeries.setData([]);
    series.setData([]);
    this.logicalRange$ = new Observable(sub => {
      chart.timeScale().subscribeVisibleLogicalRangeChange(lrc => sub.next(lrc))
    }).pipe(
        distinct(),
        map(logicalRange => {
          if (logicalRange !== null) {
            var barsInfo = series.barsInLogicalRange(logicalRange as any);
            if (barsInfo !== null && barsInfo.barsBefore < 10) {
              return logicalRange;
            }
          }
          return null;
        })
      )

      this.series = series;
      this.volumeSeries = volumeSeries;
      this.chart = chart;
  }

  update(candle: Candle) {
    if (candle) {
      this.series.update(candle as any);
      const volume = {
        time: candle.time,
        value: candle.volume,
        color:
          candle.close > candle.open
            ? buyColor
            : sellColor,
      };
      this.bars.push(candle);
      this.volumeSeries.update(volume as any);
  }
}

setData(candles: Candle[], options: LightChartSettings) {
  const newBars = this.timeframesHelper.aggregateBars(this.bars, candles, options);
  this.series.setData(newBars as any);
  const volumes = newBars.map(candle => ({
    time: candle.time,
    value: candle.volume,
    color:
      candle.close > candle.open
        ? buyColor
        : sellColor,
  }))
  this.volumeSeries.setData(volumes as any);
  this.bars = newBars;
}


clear() {
  this.chart.remove();
}

clearSeries() {
  this.bars = []
  this.series.setData([]);
  this.volumeSeries.setData([]);
}

resize(width: number, height: number) {
  this.sizes = {
    width: width,
    height: height - 30
  };
  this.chart.resize(this.sizes.width, this.sizes.height);
}

getRequest(options: LightChartSettings) {
  return this.timeframesHelper.getRequest(this.getMinTime(), options);
}
}
