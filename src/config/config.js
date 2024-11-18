import envFiles from '../constants/env.js';
import {
  PAYLOAD_ONEOF_CASE,
  PAYLOAD_LENGTH,
  SEQUENCE,
  VERSION_LENGTH,
} from '../constants/header.js';

const env = envFiles.server;
const config = {
  client: {
    VERSION: env.CLIENT_VERSION,
  },
  server: {
    PORT: env.PORT,
    HOST: env.HOST,
    VERSION: env.CLIENT_VERSION,
  },
  headers: {
    PAYLOAD_ONEOF_CASE,
    VERSION_LENGTH,
    SEQUENCE,
    PAYLOAD_LENGTH,
    TOTAL_PACKET_LENGTH: PAYLOAD_ONEOF_CASE + VERSION_LENGTH + SEQUENCE + PAYLOAD_LENGTH,
  },
};

export default config;
