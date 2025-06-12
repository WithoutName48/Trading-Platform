import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const portREST: number = 8001;
const portWS: number = 8002;

const urlRESTAPI: string = `https://api.twelvedata.com/time_series?apikey=${process.env.TWELVE_DATA_API_KEY}&interval=1min&symbol=BTC/USD&start_date=2025-06-12 20:06:00&format=JSON&end_date=2025-06-12 23:06:00&timezone=Europe/Warsaw`;

app.get('/getData', (req: Request, res: Response) => {});

const urlWebSocketAPI: string = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${process.env.TWELVE_DATA_API_KEY}`;
let WebSocketAPI: WebSocket;

const clientIdTickerSymbol: Map<string, string> = new Map<string, string>();
const tickerSymbolWS: Map<string, WebSocket> = new Map<string, WebSocket>();

interface wsClientMessage {
  action: string;
  params: string;
}

function setUpWebSocketAPIHandlers(WebSocketAPI: WebSocket) {
  WebSocketAPI.on('open', () => {
    // Authentication via API_KEY in url

    // Subscribtion
    const symbols: string = [...tickerSymbolWS.keys()].join(',');

    const subscribeMsg = {
      action: 'subscribe',
      params: {
        symbols: symbols,
      },
    };

    WebSocketAPI.send(JSON.stringify(subscribeMsg));
  });

  // Handle messages from crypto API
  WebSocketAPI.on('message', (message: string) => {
    const messageJSON = JSON.parse(message);

    if (messageJSON.event === 'price') {
      const wsClient: WebSocket | undefined = tickerSymbolWS.get(messageJSON.symbol);

      if (wsClient === undefined) {
        process.exit(1);
      }

      const msg = {
        ticker: messageJSON.symbol,
        date: new Date().getTime(),
        price: messageJSON.price as number,
      };

      wsClient.send(JSON.stringify(msg));
    }
  });

  WebSocketAPI.on('error', (error: Error) => {
    console.error(`wsCrpytoAPI error: ${error}`);
  });

  WebSocketAPI.on('close', () => {
    console.log('WebSocketAPI closed.');
  });
}

function openWebSocketCryptoAPI() {
  if (WebSocketAPI && WebSocketAPI.readyState === WebSocketAPI.OPEN) {
    WebSocketAPI.on('close', () => {
      WebSocketAPI = new WebSocket(urlWebSocketAPI);
      setUpWebSocketAPIHandlers(WebSocketAPI);
    });
    WebSocketAPI.close();
    return;
  }

  WebSocketAPI = new WebSocket(urlWebSocketAPI);
  setUpWebSocketAPIHandlers(WebSocketAPI);
}

function openWebSocketServer(portWS: number) {
  const wss: WebSocketServer = new WebSocketServer({ port: portWS });
  console.log(`Start of the WebSocket server at http://localhost:${portWS}`);

  wss.on('connection', (ws: WebSocket) => {
    const clientId: string = uuidv4();
    console.log(`Client ${clientId} has connected to WebSocket Server.`);

    ws.on('message', (message: string) => {
      const messageJSON: wsClientMessage = JSON.parse(message);

      if (messageJSON.action === 'subscribe') {
        const tickerSymbol: string = messageJSON.params;

        clientIdTickerSymbol.set(clientId, tickerSymbol);
        tickerSymbolWS.set(tickerSymbol, ws);

        openWebSocketCryptoAPI();
      }
    });

    ws.on('close', () => {
      console.log(`Bye ${clientId}!`);

      const tickerSymbol: string | undefined = clientIdTickerSymbol.get(clientId);

      if (tickerSymbol === undefined) {
        return;
      }

      clientIdTickerSymbol.delete(clientId);
      tickerSymbolWS.delete(tickerSymbol);

      openWebSocketCryptoAPI();
    });

    ws.on('error', (error: Error) => {
      console.log(`Error ${error.name}: ${error.message}`);
    });
  });
}

//
//
// START SERVERS

app.listen(portREST, () => {
  console.log(`Start of the REST server at http://localhost:${portREST}`);
});

openWebSocketServer(portWS);
