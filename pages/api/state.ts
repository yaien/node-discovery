import { NextApiRequest, NextApiResponse } from "next";
import p2p from "../../p2p/bootstrap";

export default (req: NextApiRequest, res: NextApiResponse) => {
  res.send(p2p.state());
};
