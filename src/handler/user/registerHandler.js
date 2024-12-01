import { createUser, findUserById } from '../../db/user/user.db.js';
import bcrypt from 'bcrypt';
import JoiUtils from '../../utils/joi.util.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { packetType } from '../../constants/header.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import { handleError } from '../../utils/error/errorHandler.js';

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
      const registerPayload = { registerResponse: { success: false, message, failCode: failCode.REGISTER_FAILED } };
      socket.write(createResponse(registerPayload, packetType.REGISTER_FAILED, 0));

      throw new CustomError(ErrorCodes.INVALID_REQUEST, '이미 존재하는 ID');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createUserId = await createUser(email, nickname, hashedPassword);
    const message = '회원가입 성공';
    const registerPayload = { registerResponse: { success: true, message, failCode: failCode.NONE_FAILCODE } };

    socket.write(createResponse(registerPayload, packetType.REGISTER_RESPONSE, 0));
  } catch (err) {
    handleError(socket, err);
  }
};
