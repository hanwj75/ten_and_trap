import protobuf from 'protobufjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.resolve(__dirname, '../protobuf/packets.proto'); // .proto 파일 경로 설정

export let GamePacket = null;
export let GlobalFailCode = null;
export let CardType = null;
export let RoleType = null;
export let RoomStateType = null;
export let CharacterStateType = null;
export let CharacterType = null;
export const loadProtos = async () => {
  try {
    const root = await protobuf.load(PROTO_PATH);
    GamePacket = root.lookupType('GamePacket');
    if (GamePacket) {
      console.log(`성공적으로 로드됨: ${GamePacket}`);
    }

    GlobalFailCode = root.lookupEnum('GlobalFailCode');
    if (GlobalFailCode) {
      console.log(`성공적으로 로드됨: ${GlobalFailCode}`);
    }
    CardType = root.lookupEnum('CardType');
    if (CardType) {
      console.log(`성공적으로 로드됨: ${CardType}`);
    }
    RoleType = root.lookupEnum('RoleType');
    if (RoleType) {
      console.log(`성공적으로 로드됨: ${RoleType}`);
    }
    RoomStateType = root.lookupEnum('RoomStateType');
    if (RoomStateType) {
      console.log(`성공적으로 로드됨: ${RoomStateType}`);
    }
    CharacterStateType = root.lookupEnum('CharacterStateType');
    if (CharacterStateType) {
      console.log(`성공적으로 로드됨: ${CharacterStateType}`);
    }
    CharacterType = root.lookupEnum('CharacterType');
    if (CharacterType) {
      console.log(`성공적으로 로드됨: ${CharacterType}`);
    }
  } catch (err) {
    console.error('Proto 파일 로드 중 오류 발생:', err);
    throw err;
  }
};
