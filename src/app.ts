import express, { Application, Request, Response } from "express";
import cors from "cors";
// @ts-ignore
import stockfish from "stockfish";
import validateFen from "./utilities/validate-fen";
const engine = stockfish();

const app: Application = express();
const port: number = 3001;

engine.onmessage = function (_msg: string) {};

engine.postMessage("uci");

app.use(cors());
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const isString = (val: any): val is String => !!typeof (val === "string");

app.post("/bestMove", (req: Request, res: Response) => {
  if (!validateFen(req.body.fen)) {
    res.send("Invalid fen string");
    return;
  }

  // if chess engine replies
  engine.onmessage = function (msg: any) {
    // in case the response has already been sent?
    if (res.headersSent) {
      return;
    }
    // only send response when it is a recommendation
    if (isString(msg) && msg.match("bestmove")) {
      const parts = msg.split(" ");
      const payload = parts.reduce<{ [key: string]: string }>(
        (acc, currVal, currIndex) => {
          if (currIndex % 2 === 0 && parts[currIndex + 1]) {
            acc[currVal] = parts[currIndex + 1];
          }
          return acc;
        },
        {}
      );
      res.send(payload);
    }
  };

  // run chess engine
  engine.postMessage("ucinewgame");
  engine.postMessage("position fen " + req.body.fen);
  engine.postMessage("go depth 18");
});

app.listen(port, function () {
  console.log(`App is listening on port ${port} !`);
});
