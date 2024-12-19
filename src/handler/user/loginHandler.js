import JoiUtils from '../../utils/joi.util.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { addUser } from '../../sessions/user.session.js';
import User from '../../classes/models/user.class.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import { redis } from '../../init/redis/redis.js';
import axios from 'axios';
/**
 *
 * @desc 로그인
 * @author 박건순
 *
 */
export const loginHandler = async (socket, payload) => {
  try {
    const loginUrl = 'http://login-server:3334';
    const loginData = payload.loginRequest;
    await axios.post(`${loginUrl}/login`, { loginData, socket });

    //여기서 서버 기능을 불러와서 일을하고
    const { email, password } = await JoiUtils.validateSignIn(payload.loginRequest);

    const checkExistId = await redis.getAllFieldsFromHash(`loginData${email}`);

    // 유저 클래스 생성
    const loginUser = new User(Number(checkExistId.id), socket, email, null, checkExistId.nickName);

    await addUser(loginUser);

    // 이쪽서버 세션에 추가가 필요
    const totalToken = `Bearer ${redis.getRedis(email)}`;
    const userInfoToResponse = await redis.getAllFieldsFromHash(`user:${email}`);
    await redis.delRedisByKey(`loginData${email}`);
    await redis.delRedisByKey(`user:${email}`);
    return makeResponse(socket, true, 'Login Success', totalToken, userInfoToResponse, GlobalFailCode.values.NONE_FAILCODE);
  } catch (err) {
    handleError(socket, err);
  }
};

const makeResponse = (socket, success, message, token, userInfo, failCode) => {
  const loginPayload = {
    loginResponse: { success, message, token, myInfo: userInfo, failCode },
  };

  const loginResponse = createResponse(loginPayload, PACKET_TYPE.LOGIN_RESPONSE, 0);
  socket.write(loginResponse);

  return;
};
