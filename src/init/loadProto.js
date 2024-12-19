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
export let PhaseType = null;
export let WinType = null;
export const loadProtos = async () => {
  try {
    const root = await protobuf.load(PROTO_PATH);
    GamePacket = root.lookupType('GamePacket');
    if (GamePacket) {
      // console.log(`성공적으로 로드됨: ${GamePacket}`);
    }
    GlobalFailCode = root.lookupEnum('GlobalFailCode');

    CardType = root.lookupEnum('CardType');

    RoleType = root.lookupEnum('RoleType');

    RoomStateType = root.lookupEnum('RoomStateType');

    CharacterStateType = root.lookupEnum('CharacterStateType');

    CharacterType = root.lookupEnum('CharacterType');

    PhaseType = root.lookupEnum('PhaseType');

    WinType = root.lookupEnum('WinType');
    if (
      GlobalFailCode &&
      CardType &&
      RoleType &&
      RoomStateType &&
      CharacterStateType &&
      CharacterType &&
      PhaseType &&
      WinType
    ) {
      // console.log('모든 enum 타입 로드 성공');
    }
  } catch (err) {
    console.error('Proto 파일 로드 중 오류 발생:', err);
    throw err;
  }
};
