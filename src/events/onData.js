import config from '../config/config.js';
import { PAYLOAD_ONEOF_CASE } from '../constants/header.js';
import { getProtoPacketType } from '../handler/index.js';

export const onData = (socket) => async (data) => {
  const headers = config.headers;

  socket.buffer = Buffer.concat([socket.buffer, data]);

  while (socket.Bufferlength >= headers.TOTAL_PACKET_LENGTH) {
    const payloadOneofCase = headers.PAYLOAD_ONEOF_CASE.readUint16LE(0);
    const versionLength = socket.buffer.readUint8(PAYLOAD_ONEOF_CASE);
    const totalHeaderLength = headers.TOTAL_PACKET_LENGTH + headers.VERSION_LENGTH;

    if (socket.buffer.length >= totalHeaderLength) {
      const versionOffset = headers.PAYLOAD_ONEOF_CASE + headers.VERSION_LENGTH;
      const version = socket.buffer.toString('utf8', versionOffset, versionOffset + versionLength);

      const sequenceOffset = versionOffset + versionLength;
      const sequence = socket.buffer.readUInt32LE(sequenceOffset);

      const payloadLengthOffset = sequenceOffset + headers.SEQUENCE;
      const payloadlength = socket.buffer.readUInt32LE(payloadLengthOffset);

      //패킷 전체 길이
      const packetLength = totalHeaderLength + payloadlength;

      //실제 데이터
      const payload = socket.buffer.subarray(totalHeaderLength + packetLength);
      socket.buffer = socket.buffer.subarray(packetLength);

      console.log(`PACKETLENGTH : ${packetLength}`);
      console.log(`VERSION : ${version}`);
      console.log(`SEQUENCE : ${sequence}`);
      console.log(`PAYLOAD: ${payload}`);

      try {
        //모든 패킷 처리
        const decodedPacket = GamePacket.decode(payload);
        const handler = getProtoPacketType(payloadOneofCase);
        if (handler) {
          await handler(socket, decodedPacket);
        }
      } catch (err) {
        console.error('패킷 처리 에러:', err);
      }
    } else {
      break;
    }
  }
};
export const getPacketTypeName = (packetType) => {
  return (
    Object.keys(PAYLOAD_ONEOF_CASE).find((key) => PAYLOAD_ONEOF_CASE[key] === packetType) ||
    'Unknown packet type'
  );
};