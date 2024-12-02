import { packetType } from '../../constants/header.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import { createResponse } from '../../utils/response/createResponse.js';
/**
 * @dest 카드 카운터 
 * @author 박건순
 *
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
  try {
    const { reactionType } = payload.reactionRequest;
    const failCode = GlobalFailCode.values;
    console.log('hello:' + reactionType);
    if (reactionType === 0) {
    } else {
    }

    const reactionPayload = { reactionResponse: { success: true, failCode: failCode.NONE_FAILCODE } };
    socket.write(createResponse(reactionPayload, packetType.REACTION_RESPONSE, 0));
  } catch (err) {
    console.error('reaction 에러:', err);
  }
};
