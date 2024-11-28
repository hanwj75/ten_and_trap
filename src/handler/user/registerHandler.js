import { createUser, findUserById } from '../../db/user/user.db.js';
import bcrypt from 'bcrypt';
import JoiUtils from '../../utils/joi.util.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { packetType } from '../../constants/header.js';
import { GlobalFailCode } from '../../init/loadProto.js';

/**
 *
 * @desc 회원가입
 * @author 박건순
 *
 */

export const registerHandler = async (socket, payload) => {
  try {
    const failCode = GlobalFailCode.values;
    const { email, nickname, password } = await JoiUtils.validateSignUp(payload.registerRequest);
    const checkExistId = await findUserById(email);

    if (checkExistId) {
      const message = '이미 존재하는 ID 입니다.';
      const registerPayload = { registerResponse: { success: false, message, failCode: failCode.INVALID_REQUEST } };
      socket.write(createResponse(registerPayload, packetType.REGISTER_RESPONSE, 0));

      throw Error('이미 존재하는 ID');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createUserId = await createUser(email, nickname, hashedPassword);
    const message = '회원가입 성공';
    const registerPayload = { registerResponse: { success: true, message, failCode: failCode.NONE_FAILCODE } };

    socket.write(createResponse(registerPayload, packetType.REGISTER_RESPONSE, 0));
  } catch (err) {
    console.error(`회원가입 에러`, err);
  }
};
