
import * as React from 'react';
import styles from './Chart.module.css'
import type { CryptoPriceUpdate } from '../../interfaces/ServerMessages';
import { formatDatePoland } from '../../utils/dateFormatter';

function Chart(props: any) {
  const tickerSymbol: string = props.ticker;

  const [prices, setPrices] = React.useState<CryptoPriceUpdate[]>([]);

  React.useEffect(() => {
    const ws: WebSocket = new WebSocket('ws://localhost:8002');

    ws.onopen = () => {
      console.log('Connected to WebSocket server');

      const subscribeMsg = {
        action: 'subscribe',
        params: tickerSymbol,
      };

      ws.send(JSON.stringify(subscribeMsg));
    };

    ws.onerror = () => {
      console.error('WebSocket encountered an error. Inspect "close" event for details.');
    };

    ws.onclose = (event: CloseEvent) => {
      console.error(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
    };

    ws.onmessage = (event: MessageEvent) => {
      const msgJSON: CryptoPriceUpdate = JSON.parse(event.data);
      setPrices(prevPrices => [...prevPrices, msgJSON]);
    };

    return () => {
      ws.close();
    };
  }, []);

  const liPrices = prices.map((val: CryptoPriceUpdate, indx: number) => {
    return (
      <li key={indx}>{`${formatDatePoland(val.date)}: ${val.price}$`}</li>
    );
  });

  return (
    <div className={styles.container}>
      <h1>Dashboard for: {tickerSymbol}</h1>
      <ul>
        {liPrices}
      </ul>
    </div>
  );
}

export default Chart;
