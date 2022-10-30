import config from "./config";
import { P2P } from "./p2p";

const p2p = new P2P(config);
p2p.start();

export default p2p;
