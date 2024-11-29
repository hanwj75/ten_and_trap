/**
 * @dest 카드 카운터 
 * @author 박건순
 * @todo 카드 사용 검증하기
 *
 * message C2SReactionRequest {
    ReactionType reactionType = 1; // NOT_USE_CARD = 1
}

message S2CReactionResponse {
    bool success = 1;
    GlobalFailCode failCode = 2;
} 
 */

export const reactionHandler = async (socket, payload) => {
  const { reactionType } = payload.reactionRequest;

  console.log('hi');
  console.log('hello:' + reactionType);
};
