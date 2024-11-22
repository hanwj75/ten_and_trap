import config from '../../config/config.js';
import envFiles from '../../constants/env.js';
import { GamePacket } from '../../init/loadProto.js';

const createHeader = (payloadLength, packetType, sequence) => {
  const { PAYLOAD_ONEOF_CASE, VERSION_LENGTH, SEQUENCE, PAYLOAD_LENGTH } = config.headers;
  const CLIENT_VERSION = envFiles.server.CLIENT_VERSION;

  const packetTypeBuffer = Buffer.alloc(PAYLOAD_ONEOF_CASE);
  packetTypeBuffer.writeUInt16BE(packetType, 0);

  const versionBuffer = Buffer.from(CLIENT_VERSION, 'utf8');

  const versionLengthBuffer = Buffer.alloc(VERSION_LENGTH);
  versionLengthBuffer.writeUInt8(versionBuffer.length, 0);

  const sequenceBuffer = Buffer.alloc(SEQUENCE);
  sequenceBuffer.writeUInt32BE(sequence, 0);

  const payloadLengthBuffer = Buffer.alloc(PAYLOAD_LENGTH);
  payloadLengthBuffer.writeUInt32BE(payloadLength, 0);

  return Buffer.concat([
    packetTypeBuffer,
    versionLengthBuffer,
    versionBuffer,
    sequenceBuffer,
    payloadLengthBuffer,
  ]);
};

export const createResponse = (payload, packetType, sequence) => {
  const payloadBuffer = GamePacket.encode(GamePacket.create(payload)).finish();
  // const test = GamePacket.decode(payloadBuffer); //response 데이터 확인

  const header = createHeader(payloadBuffer.length, packetType, sequence);

  return Buffer.concat([header, payloadBuffer]);
};
