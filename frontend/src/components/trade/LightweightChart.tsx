'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, SeriesMarker, Time, IPriceLine, CandlestickSeries, createSeriesMarkers } from 'lightweight-charts';

export interface OrderMarker {
  id: string;
  time: number; // Unix timestamp in seconds
  price: number;
  side: 'BUY' | 'SELL';
  quantity?: number;
  takeProfit?: number;
  stopLoss?: number;
}

interface LightweightChartProps {
  symbol: string;
  orders: OrderMarker[];
  assetType?: string;
}

export function LightweightChart({ symbol, orders, assetType }: LightweightChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const seriesMarkersRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Strip prefix if any (e.g., BINANCE:BTCUSDT -> BTCUSDT)
  const normalizedSymbol = symbol.replace(/^.*:/, '').toUpperCase().trim();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 1. Initialize Chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0B0E11' },
        textColor: '#848E9C',
      },
      grid: {
        vertLines: { color: '#2B3139' },
        horzLines: { color: '#2B3139' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1, // Normal crosshair
        vertLine: {
          color: '#848E9C',
          labelBackgroundColor: '#2B3139',
        },
        horzLine: {
          color: '#848E9C',
          labelBackgroundColor: '#2B3139',
        },
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderVisible: false,
      wickUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
    });

    const seriesMarkers = createSeriesMarkers(candlestickSeries);

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    seriesMarkersRef.current = seriesMarkers;

    // Responsive resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    // 2. Fetch Historical Data from Binance
    const fetchHistory = async () => {
      try {
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${normalizedSymbol}&interval=1m&limit=1000`);
        const data = await response.json();

        if (Array.isArray(data)) {
          const klines = data.map((d: any) => ({
            time: (d[0] / 1000) as Time,
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
          }));
          candlestickSeries.setData(klines);
        }
      } catch (error) {
        console.error('Error fetching historical klines:', error);
      }
    };

    fetchHistory().then(() => {
      // 3. Connect to Binance WebSockets for Live Data
      const wsUrl = `wss://stream.binance.com:9443/ws/${normalizedSymbol.toLowerCase()}@kline_1m`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.e === 'kline' && message.k) {
            const kline = message.k;
            candlestickSeries.update({
              time: (kline.t / 1000) as Time,
              open: parseFloat(kline.o),
              high: parseFloat(kline.h),
              low: parseFloat(kline.l),
              close: parseFloat(kline.c),
            });
          }
        } catch (e) {
          console.error('WebSocket parse error:', e);
        }
      };
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      if (wsRef.current) {
        wsRef.current.close();
      }
      chart.remove();
    };
  }, [normalizedSymbol]);

  const priceLinesRef = useRef<IPriceLine[]>([]);

  // 4. Update Markers and Price Lines when `orders` changes
  useEffect(() => {
    if (!seriesRef.current) return;

    // Clear old price lines
    priceLinesRef.current.forEach((line) => {
      seriesRef.current?.removePriceLine(line);
    });
    priceLinesRef.current = [];

    const markers: SeriesMarker<Time>[] = orders.map((order) => {
      const isBuy = order.side === 'BUY';

      // Draw entry price line
      const entryLine = seriesRef.current!.createPriceLine({
        price: order.price,
        color: isBuy ? '#0ecb81' : '#f6465d',
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: `${isBuy ? 'BUY' : 'SELL'} ENTRY`,
      });
      priceLinesRef.current.push(entryLine);

      // Draw Take Profit line
      if (order.takeProfit && order.takeProfit > 0) {
        const tpLine = seriesRef.current!.createPriceLine({
          price: order.takeProfit,
          color: '#22c55e', // bright green
          lineWidth: 1,
          lineStyle: 1, // Dotted
          axisLabelVisible: true,
          title: 'TP',
        });
        priceLinesRef.current.push(tpLine);
      }

      // Draw Stop Loss line
      if (order.stopLoss && order.stopLoss > 0) {
        const slLine = seriesRef.current!.createPriceLine({
          price: order.stopLoss,
          color: '#ef4444', // bright red
          lineWidth: 1,
          lineStyle: 1, // Dotted
          axisLabelVisible: true,
          title: 'SL',
        });
        priceLinesRef.current.push(slLine);
      }

      return {
        time: order.time as Time,
        position: isBuy ? 'belowBar' : 'aboveBar',
        color: isBuy ? '#0ecb81' : '#f6465d',
        shape: isBuy ? 'arrowUp' : 'arrowDown',
        text: `${isBuy ? 'BUY' : 'SELL'} @ ${order.price}`,
        size: 2,
      };
    });

    markers.sort((a, b) => (a.time as number) - (b.time as number));

    if (seriesMarkersRef.current) {
      seriesMarkersRef.current.setMarkers(markers);
    }
  }, [orders]);

  return (
    <div ref={chartContainerRef} className="absolute inset-0" />
  );
}
