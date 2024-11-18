import { createUser, findUserById } from '../../db/user/user.db.js';
import CustomError from '../../utils/error/customError.js';
import bcrypt from 'bcrypt';
import JoiUtils from '../../utils/joi.util.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { packetType } from '../../constants/header.js';
/**
 *
 * @desc 회원가입
 * @author 박건순
 *
 */

const registerHandler = async (socket, payload) => {
  try {
    const { email, nickname, password } = await JoiUtils.validateSignUp(payload.registerRequest);
    const checkExistId = await findUserById(email);

    if (checkExistId) {
      const responsePayload = {
        success: false,
        message: '이미 존재하는 ID',
        failCode: 2,
      };
      const registerResponse = createResponse(responsePayload, packetType.REGISTER_RESPONSE, 0);
      socket.write(registerResponse);

      throw new CustomError(ErrorCodes.REGISTER_FAILED, '이미 존재하는 ID');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createUserId = await createUser(email, nickname, hashedPassword);
    const responsePayload = {
      success: true,
      message: 'Register Success',
      failCode: 0,
    };

    const registerResponse = createResponse(responsePayload, packetType.REGISTER_RESPONSE, 0);
    socket.write(registerResponse);
  } catch (err) {
    throw new CustomError(ErrorCodes.REGISTER_FAILED, err.message);
  }
};

export default registerHandler;
