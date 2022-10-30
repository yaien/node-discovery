import type { NextPage } from "next";
import { useEffect, useState, FC } from "react";
import { State } from "../p2p";
import cs from "classnames";
import styles from "../styles/index.module.css";
import p2p from "../p2p/bootstrap";
import moment from "moment";

const Since: FC<{ date: string }> = ({ date }) => {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    const interval = setInterval(() => setDisplay(moment(date).fromNow()), 1000);
    return () => clearInterval(interval);
  }, [date]);

  return <>{display}</>;
};

const Home: NextPage<{ state: State }> = (props) => {
  const [dark, setDark] = useState(false);
  const [state, setState] = useState<State>(props.state);

  useEffect(() => {
    const es = new EventSource("/api/sse");
    es.addEventListener("message", (ev) => setState(JSON.parse(ev.data)));
    return () => es.close();
  }, []);

  useEffect(() => {
    const listener = (ev: MediaQueryListEvent) => setDark(ev.matches);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  if (!state) return null;

  return (
    <div className={cs(styles.main, { [styles.mainDark]: dark })}>
      <div className="container-md">
        <ul className="list-group">
          <li className={cs("list-group-item d-flex justify-content-between align-items-center", { "text-bg-dark": dark })}>
            <div className="ms-2 me-auto">
              <div className="fw-bold">{state.current.name}</div>
              <div className="fs-6">{state.current.addr}</div>
              <div className="fs-6 text-muted">
                <Since date={state.current.updatedAt} />
              </div>
            </div>
            <span className="badge bg-primary rounded-pill">current</span>
          </li>
          {state.clients.map((client) => (
            <li key={client.id} className={cs("list-group-item", { "text-bg-dark": dark })}>
              <div className="ms-2 me-auto">
                <div className="fw-bold">{client.name}</div>
                <div className="fs-6">{client.addr}</div>
                <div className="fs-6 text-muted">
                  <Since date={client.updatedAt} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export function getServerSideProps() {
  return { props: { state: p2p.state() } };
}

export default Home;
