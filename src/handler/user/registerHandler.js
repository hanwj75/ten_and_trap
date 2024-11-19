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
    const { email, nickname, password } = await JoiUtils.validateSignUp(payload.registerRequest);
    const checkExistId = await findUserById(email);

    if (checkExistId) {
      const responsePayload = {
        registerResponse: {
          success: false,
          message: '이미 존재하는 ID',
          failCode: GlobalFailCode.values.INVALID_REQUEST,
        },
      };
      const registerResponse = createResponse(responsePayload, packetType.REGISTER_RESPONSE, 0);
      socket.write(registerResponse);

      throw Error('이미 존재하는 ID');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createUserId = await createUser(email, nickname, hashedPassword);
    const responsePayload = {
      registerResponse: {
        success: true,
        message: 'Register Success',
        failCode: GlobalFailCode.values.NONE_FAILCODE,
      },
    };

    const registerResponse = createResponse(responsePayload, packetType.REGISTER_RESPONSE, 0);
    socket.write(registerResponse);
  } catch (err) {
    console.error(err);
  }
};
