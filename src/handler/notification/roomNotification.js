/**
 * @dest 방 참여 알림
 * @author 한우종
 * @todo 방에 입장한 경우 다른 플레이어들에게 참여한걸 알려줘야함
 * message S2CJoinRoomNotification {
    UserData joinUser = 1;
}
 */
export const joinRoomNotificationHandler = () => {};

/**
 * @dest 방 나가기 알림
 * @author 한우종
 * @todo 참여한 방에서 나갔다면 다른 플레이어들에게 나간걸 알려줘야함
 * message S2CLeaveRoomNotification {
    int64 userId = 1;
}
 */
export const leaveRoomNotificationHandler = () => {};
