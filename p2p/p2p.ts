import { v4 as uuid } from "uuid";
import EventEmitter from "events";
import axios from "axios";
import sha256 from "sha256";

export interface Client {
  id: string;
  name: string;
  addr: string;
  createdAt: string;
  updatedAt: string;
  refreshedAt: Date;
}

export interface State {
  current: Client;
  clients: Client[];
}

export interface Config {
  name: string;
  addr: string;
  key: string;
  lookup?: string;
  scan?: boolean;
}

export class P2P {
  private scaneable?: boolean;
  private current: Client;
  private clients: Map<string, Client>;
  private key: string;
  private lookup?: string;
  private emmiter = new EventEmitter();

  constructor(config: Config) {
    this.scaneable = config.scan;
    this.key = config.key;
    this.lookup = config.lookup;
    this.clients = new Map();
    this.current = {
      id: uuid(),
      name: config.name,
      addr: config.addr,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      refreshedAt: new Date(),
    };
  }

  get state(): State {
    return { current: this.current, clients: Array.from(this.clients.values()) };
  }

  subscribe(cb: (state: State) => void) {
    this.emmiter.on("state", cb);
    return () => {
      this.emmiter.off("state", cb);
    };
  }

  register(signature: string, client: Client) {
    this.validate(signature, client);
    this.save(client);
  }

  start() {
    const callback = this.scaneable ? this.scan : this.check;
    setInterval(callback.bind(this), 10000);
  }

  private save(client: Client) {
    if (client.addr == this.current.addr) return;
    client.refreshedAt = new Date();
    this.clients.set(client.addr, client);
  }

  private validate(signature: string, client: Client) {
    const hash = sha256(client.id + client.name + client.addr + this.key);
    if (hash !== signature) throw new Error("Invalid signature");
  }

  private check() {
    const now = new Date();
    for (const client of this.clients.values()) {
      const minutes = now.getMinutes() - client.refreshedAt.getMinutes();
      if (minutes >= 5) {
        this.clients.delete(client.addr);
        this.emmiter.emit("state", this.state);
      }
    }
  }

  private async scan() {
    if (!this.clients.size && this.lookup) {
      return this.discover(this.lookup);
    }
    for (const addr of this.clients.keys()) {
      await this.discover(addr);
    }
  }

  private async discover(addr: string) {
    try {
      const signature = sha256(this.current.id + this.current.name + this.current.addr + this.key);
      const headers = { "X-Signature": signature };
      const res = await axios.post<State>(addr + "/api/connect", this.current, { headers });
      const clients = [res.data.current, ...res.data.clients];
      clients.forEach((client) => this.save(client));
      console.log("connected peer", addr);
    } catch (err) {
      console.log("disconnected peer", addr, err);
      this.clients.delete(addr);
    } finally {
      this.emmiter.emit("state", this.state);
    }
  }
}
