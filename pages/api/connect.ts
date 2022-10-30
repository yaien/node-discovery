import type { NextApiRequest, NextApiResponse } from "next";
import p2p from "../../p2p/bootstrap";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "POST") return;
  try {
    const signature = req.headers["x-signature"] as string;
    p2p.register(signature, req.body);
    res.send(p2p.state());
  } catch (err) {
    res.status(401).send({ error: (err as Error).message });
  }
}
