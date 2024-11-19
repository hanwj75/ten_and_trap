// NONE_FAILCODE = 0;
// UNKNOWN_ERROR = 1;
// INVALID_REQUEST = 2;
// AUTHENTICATION_FAILED = 3;
// CREATE_ROOM_FAILED = 4;
// JOIN_ROOM_FAILED = 5;
// LEAVE_ROOM_FAILED = 6;
// REGISTER_FAILED = 7;
// ROOM_NOT_FOUND = 8;
// CHARACTER_NOT_FOUND = 9;
// CHARACTER_STATE_ERROR = 10;
// CHARACTER_NO_CARD = 11;
// INVALID_ROOM_STATE = 12;
// NOT_ROOM_OWNER = 13;
// ALREADY_USED_BBANG = 14;
// INVALID_PHASE = 15;
// CHARACTER_CONTAINED = 16;

/**
 * @dest 방 만들기
 * @author 한우종
 * @todo 방 생성하기 요청 들어올시 방 생성해주기
 * message S2CCreateRoomResponse {
    bool success = 1;
    RoomData room = 2;
    GlobalFailCode failCode = 3;
}

 */
export const createRoomHandler = (socket, payload) => {};

/**
 * @dest 방 리스트 조회
 * @author 한우종
 * @todo 현재 존재하는 방 목록 보여주기
 * message S2CGetRoomListResponse{
    repeated RoomData rooms = 1;
}

 */
export const getRoomListHandler = (socket, payload) => {};

/**
 * @dest 방 들어가기
 * @author 한우종
 * @todo 방 리스트에 있는 방 선택해서 들어가기
 * message S2CJoinRoomResponse {
    bool success = 1;
    RoomData room = 2;
    GlobalFailCode failCode = 3;
}
 */
export const joinRoomHandler = (socket, payload) => {};

/**
 * @dest 랜덤매칭
 * @author 한우종
 * @todo 존재하는 방 중에서 랜덤하게 들어가기
 * message S2CJoinRandomRoomResponse {
    bool success = 1;
    RoomData room = 2;
    GlobalFailCode failCode = 3;
} 
 */
export const joinRandomRoomHandler = (socket, payload) => {};

/**
 * @dest 방 나가기
 * @author 한우종
 * @todo 참여한 방에서 나가기
 * message S2CLeaveRoomResponse {
    bool success = 1;
    GlobalFailCode failCode = 2;
}
 */
export const leaveRoomHandler = (socket, payload) => {};
