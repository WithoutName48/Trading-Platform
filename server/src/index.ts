import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { error } from 'console';

dotenv.config();

const app = express();
const portREST: number = 8001;
const portWS: number = 8002;

const urlCryptoAPI: string = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${process.env.TWELVE_DATA_API_KEY}`;
let wsCryptoAPI: WebSocket;

const clientIdTickerSymbol: Map<string, string> = new Map<string, string>();
const tickerSymbolWS: Map<string, WebSocket> = new Map<string, WebSocket>();

interface wsClientMessage {
  action: string;
  params: string;
}

function setUpWSCryptoAPIHandlers(wsCryptoAPI: WebSocket) {
  wsCryptoAPI.on('open', () => {
    // Authentication via API_KEY in url

    // Subscribtion
    const symbols: string = [...tickerSymbolWS.keys()].join(',');

    const subscribeMsg = {
      action: 'subscribe',
      params: {
        symbols: symbols,
      },
    };

    wsCryptoAPI.send(JSON.stringify(subscribeMsg));
  });

  // Handle messages from crypto API
  wsCryptoAPI.on('message', (message: string) => {
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

  wsCryptoAPI.on('error', (error: Error) => {
    console.error(`wsCrpytoAPI error: ${error}`);
  });

  wsCryptoAPI.on('close', () => {
    console.log('wsCryptoAPI closed.');
  });
}

function openWebSocketCryptoAPI() {
  if (wsCryptoAPI && wsCryptoAPI.readyState === wsCryptoAPI.OPEN) {
    wsCryptoAPI.on('close', () => {
      wsCryptoAPI = new WebSocket(urlCryptoAPI);
      setUpWSCryptoAPIHandlers(wsCryptoAPI);
    });
    wsCryptoAPI.close();
    return;
  }

  wsCryptoAPI = new WebSocket(urlCryptoAPI);
  setUpWSCryptoAPIHandlers(wsCryptoAPI);
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
