# Dash For Ten
## 프로젝트 소개
**프롤로그**<br>
<img src="">

동네에서 소문난 카드 대회가 열린다. 규칙은 간단하다. 카드를 모으고 전략적으로 플레이해서 먼저 10장을 손에 넣으면 승리!
카드를 사용할 때마다 어떤 상황이 벌어질지 예측할 수 없고, 상대의 한 수에 따라 판이 뒤집히기도 한다. 하지만 바로 그 변수가 이 게임의 묘미!
친구와, 가족과, 또는 처음 만난 상대와 한 판 승부를 벌이며 긴장감과 웃음을 나눌 준비가 되었는가?
10장을 먼저 모으는 자가 챔피언이 된다!<br>

---

**게임 규칙**<br>
+ 플레이어 : 4 ~ 7인 (5명 권장)
+ 낮(30초)과 밤(10초)으로 이루어진 한 턴이 반복됩니다. (승자가 나올 때 까지)
+ 낮이 되었을 때 자신의 손에 카드 10장이 있으면 게임을 승리합니다.
+ 게임 시작 시 낮부터 시작하여 술래가 지정됩니다.
+ 술래는 낮 동안 여러 효과가 있는 다양한 카드를 사용하여 자신의 패를 10장에 가깝게 혹은 상대방의 패가 10장이 되지 못하게 방해할 수 있습니다. (카드는 1장만 사용가능 합니다.)
+ 술래에게 타겟이 된 유저는 방어 효과가 있는 카드를 사용하여 효과를 무시하거나 온전히 피해를 받을지 선택할 수 있습니다.
+ 밤 시간동안 다음 술래가 정해지고 다음 술래는 카드를 1장 드로우하며 모든 유저는 정지하게 됩니다.
+ 술래가 낮 동안 카드를 사용하지 못했다면 카드를 1장 버리게 됩니다.

## 서비스 아키텍처


## 게임 핵심 기능
---

**이동 방식**
+ 이동<br>
  플레이어는 낮 동안 이동이 가능합니다! 상하좌우 방향키 또는 WASD 키를 사용하여 움직일 수 있습니다. 이동시 클라이언트에서 서버로 패킷을 보내 서버에서 방의 모든 유저에게 응답하는 형태로 위치동기화를 처리했습니다.

---

**공격 방식**
<img src="">
---

**방어 방식**

---

**플레이 방식**
