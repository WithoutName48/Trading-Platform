import * as React from 'react';
import type { CryptoPriceUpdate } from './interfaces/ServerMessages';

function App(props: any) {
  const tickerSymbol: string = props.ticker;

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

      const dateFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat('PL', {
        timeZone: 'Europe/Warsaw',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      console.log(
        `${dateFormat.format(new Date(msgJSON.date))} ${msgJSON.ticker}: ${msgJSON.price}`
      );
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <>
      <h1>Dashboard for: {tickerSymbol}</h1>
    </>
  );
}

export default App;
