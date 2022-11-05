import { v4 as uuid } from "uuid";
import EventEmitter from "events";
import axios from "axios";
import sha256 from "sha256";
import winston from "winston";

export interface Client {
  id: string;
  name: string;
  addr: string;
  createdAt: string;
  updatedAt: string;
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
}

export class P2P extends EventEmitter {
  private current: Client;
  private clients: Map<string, Client>;
  private key: string;
  private lookup?: string;

  constructor(config: Config) {
    super();
    this.key = config.key;
    this.lookup = config.lookup;
    this.clients = new Map();
    this.current = {
      id: uuid(),
      name: config.name,
      addr: config.addr,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  state(): State {
    return { current: this.current, clients: Array.from(this.clients.values()) };
  }

  start() {
    setInterval(() => this.scan(), 5000);
  }

  register(signature: string, client: Client) {
    this.validate(signature, client);
    this.save(client);
  }

  private validate(signature: string, client: Client) {
    const hash = sha256(client.id + client.name + client.addr + this.key);
    if (hash !== signature) throw new Error("Invalid signature");
  }

  private save(client: Client) {
    if (client.addr == this.current.addr) return;
    this.clients.set(client.addr, client);
  }

  private async discover(addr: string) {
    try {
      const signature = sha256(this.current.id + this.current.name + this.current.addr + this.key);
      const headers = { "X-Signature": signature };
      const res = await axios.post<State>(addr + "/api/connect", this.current, { headers });
      const clients = [res.data.current, ...res.data.clients];
      clients.forEach((client) => this.save(client));
    } catch (err) {
      winston.info("disconnected peer", err);
      this.clients.delete(addr);
    } finally {
      this.emit("state", this.state());
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
}
