import { NextApiRequest, NextApiResponse } from "next";
import { Server } from "socket.io";
import { State } from "../../p2p";
import p2p from "../../p2p/bootstrap";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const socket: any = res.socket;

  if (socket.server.io) {
    res.end();
    return;
  }

  const io = new Server(socket.server);
  socket.server.io = io;

  io.on("connection", (socket) => {
    const listener = (state: State) => socket.emit("state", state);
    const end = () => p2p.off("state", listener);
    p2p.on("state", listener);
    socket.on("disconnect", end);
  });

  p2p.on("state", (state) => io.emit("state", state));
  res.end();
}
