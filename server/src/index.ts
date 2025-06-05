import express, { Request, Response } from 'express';

const app = express();
const port = 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('<h1>Hello World!</h1>');
});

app.listen(port, () => {
  console.log(`Start of the server at http://localhost:${port}`);
});
