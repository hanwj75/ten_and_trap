import net from 'net';
import { onConnection } from './events/onConnection.js';
import initServer from './init/index.js';
import config from './config/config.js';

const serverInfo = config.server;
const server = net.createServer(onConnection);

initServer()
  .then(() => {
    server.listen(serverInfo.PORT, serverInfo.HOST, () => {
      console.log(`Ten And Trap Server Open Port : ${serverInfo.PORT} Host:${serverInfo.HOST}`);
    });
  })
  .catch((err) => {
    console.error(`Server Init Error : ${err}`);
    process.exit(1);
  });
