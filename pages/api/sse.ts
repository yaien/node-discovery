import p2p from "../../p2p/bootstrap";
import { NextApiRequest, NextApiResponse } from "next";
import { State } from "../../p2p";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Content-Encoding": "none",
  });

  const listener = (state: State) => {
    const data = JSON.stringify(state);
    res.write(`data: ${data}\n\n`);
  };

  const end = () => p2p.off("state", listener);

  p2p.on("state", listener);
  res.on("error", end);
  req.on("close", end);
}
