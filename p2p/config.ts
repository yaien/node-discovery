export default {
  addr: process.env.P2P_ADDR as string,
  name: process.env.P2P_NAME as string,
  key: process.env.P2P_KEY as string,
  lookup: process.env.P2P_LOOKUP_ADDR as string,
};
