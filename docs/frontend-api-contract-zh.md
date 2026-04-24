# Escape from Delta 前端接口与合约对接清单

本文是给前端开发的接口速查表。

重点覆盖：

- Next API 路由
- 每个接口的 request / response
- 合约指令与前端对应关系
- 常见错误码
- 页面接入建议

## 1. 基础信息

- Program ID：`7ueVgYfrwidjpwMCBfGyHCoVpaVNe7Ep1h2Mxv1ENBYQ`
- 当前模式：前端请求 Next API，服务端构造 unsigned transaction，钱包负责签名发送

合约入口：

- [lib.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/lib.rs)

服务端交易构造：

- [local-demo.ts](/home/solana/programs/EscapeFromDelta/app/src/lib/local-demo.ts)

## 2. 通用交易返回格式

所有 `/api/tx/*` 路由正常时基本都返回：

```json
{
  "serializedTransaction": "<base64>",
  "blockhash": "<recent-blockhash>",
  "lastValidBlockHeight": 123456789
}
```

异常时返回：

```json
{
  "error": "some-error-message"
}
```

前端拿到 `serializedTransaction` 后：

1. 反序列化为 `Transaction`
2. 钱包签名
3. 发送到链上
4. 轮询确认状态

当前实现位置：

- [provider.tsx](/home/solana/programs/EscapeFromDelta/app/src/wallet/provider.tsx)

## 3. 读取接口

### 3.1 查询玩家资料

**GET** `/api/player/[wallet]`

文件：

- [route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/player/[wallet]/route.ts)

#### 请求参数

- `wallet`: 钱包地址，放在路径里

#### 返回示例

```json
{
  "profile": {
    "schemaVersion": 1,
    "wallet": "xxx",
    "grantClaimed": true,
    "edcoinsBalance": "20000",
    "armorPointBalance": 200,
    "weaponPointBalance": 200,
    "warehouseNonce": "1",
    "nextRaidId": "1",
    "activeRaid": "optional-pubkey"
  },
  "address": "player-profile-pda"
}
```

#### 说明

- `edcoinsBalance / warehouseNonce / nextRaidId` 用字符串返回
- `armorPointBalance / weaponPointBalance` 是 tenths
- `activeRaid != null` 说明链上有未结算战局

### 3.2 查询战绩

**GET** `/api/records/[wallet]?limit=50`

文件：

- [route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/records/[wallet]/route.ts)

#### 请求参数

- `wallet`: 钱包地址
- `limit`: 可选，默认 `50`

#### 返回示例

```json
{
  "records": [
    {
      "raidId": "1",
      "result": "succeeded",
      "retainedAssets": [],
      "lostAssets": [],
      "randomEvents": []
    }
  ]
}
```

## 4. 交易接口

### 4.1 Connect Wallet / 初始化玩家

**POST** `/api/tx/connect`

文件：

- [route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/tx/connect/route.ts)

#### 请求

```json
{
  "player": "<wallet-pubkey>"
}
```

#### 对应合约指令

- `create_or_connect_player`

#### 作用

- 新玩家初始化 `PlayerProfile`
- 首次领取 starter grant

---

### 4.2 开始行动

**POST** `/api/tx/start`

文件：

- [route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/tx/start/route.ts)

#### 请求

```json
{
  "player": "<wallet-pubkey>"
}
```

#### 当前固定参数

当前服务端固定写死：

- armor `2.0`
- weapon `2.0`
- entry fee `1000 EDcoins`

对应代码：

- [local-demo.ts](/home/solana/programs/EscapeFromDelta/app/src/lib/local-demo.ts)

#### 对应合约指令

- `start_raid(armor_tenths, weapon_tenths, entry_fee)`

#### 常见错误

- `Custom:6004` -> `InsufficientFunds`
- `Custom:6006` -> `RaidAlreadyActive`
- `Custom:6009` -> `InvalidEquipment`

---

### 4.3 开启容器

**POST** `/api/tx/open`

文件：

- [route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/tx/open/route.ts)

#### 请求

钱包直签路径：

```json
{
  "player": "<wallet-pubkey>",
  "containerIndex": 0,
  "finalRandomValue": 5
}
```

session key 路径：

```json
{
  "player": "<wallet-pubkey>",
  "sessionSigner": "<session-pubkey>",
  "sessionToken": "<session-token-pubkey>",
  "containerIndex": 0,
  "finalRandomValue": 5
}
```

#### 对应合约指令

- `open_container(container_index, base, same_area_steps, area_changes, final_random_value)`

#### 当前 demo 约定

- `base / same_area_steps / area_changes` 当前服务端都传 `0`
- `finalRandomValue` 目前是 demo 随机/固定值，不是生产级随机方案

---

### 4.4 战斗

**POST** `/api/tx/fight`

文件：

- [route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/tx/fight/route.ts)

#### 请求

钱包路径：

```json
{
  "player": "<wallet-pubkey>"
}
```

session 路径：

```json
{
  "player": "<wallet-pubkey>",
  "sessionSigner": "<session-pubkey>",
  "sessionToken": "<session-token-pubkey>"
}
```

#### 对应合约指令

- `fight_enemy(armor, weapon, enemy, final_random_value)`

#### 说明

这些参数当前由服务端根据链上 `RaidSession` 填入，不需要前端自己组装。

---

### 4.5 切换区域

**POST** `/api/tx/move`

文件：

- [route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/tx/move/route.ts)

#### 请求

```json
{
  "player": "<wallet-pubkey>",
  "area": "low" | "medium" | "high"
}
```

如果使用 session key，还要带：

```json
{
  "sessionSigner": "<session-pubkey>",
  "sessionToken": "<session-token-pubkey>"
}
```

#### 对应合约指令

- `move_area(target_area)`

#### 常见错误

- `invalid-area`：前端传的 area 不合法

---

### 4.6 成功撤离

**POST** `/api/tx/extract`

文件：

- [route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/tx/extract/route.ts)

#### 请求

```json
{
  "player": "<wallet-pubkey>"
}
```

#### 对应合约指令

- `extract_raid`

#### 作用

- 结束当前 raid
- 写 `BattleRecord`
- 清 `PlayerProfile.active_raid`

---

### 4.7 失败结算 / 放弃战局

**POST** `/api/tx/fail`

文件：

- [route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/tx/fail/route.ts)

#### 请求

```json
{
  "player": "<wallet-pubkey>"
}
```

#### 对应合约指令

- `settle_failed_raid`

#### 当前用途

- 超时失败
- 战斗失败后结算
- 主动放弃战局

---

### 4.8 购买护甲/武器参数余额

**POST** `/api/tx/purchase-loadout`

文件：

- [route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/tx/purchase-loadout/route.ts)

#### 请求

```json
{
  "player": "<wallet-pubkey>",
  "kind": "armor" | "weapon"
}
```

#### 对应合约指令

- `purchase_loadout_points(kind)`

#### 当前规则

- `armor`：花 `1000 EDcoins`，买 `+1.0 armor-point balance`
- `weapon`：花 `1000 EDcoins`，买 `+1.0 weapon-point balance`

## 5. 合约指令总览

以下是目前前端最可能会碰到的指令：

### 玩家主流程

- `create_or_connect_player`
- `convert_sol_to_edcoins`
- `purchase_loadout_points`
- `start_raid`
- `open_container`
- `fight_enemy`
- `move_area`
- `extract_raid`
- `settle_failed_raid`

### 交易系统

- `create_listing`
- `purchase_listing`
- `cancel_listing`

### 管理员

- `initialize_admin_profile`
- `create_difficulty_version`

定义位置：

- [lib.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/lib.rs)

## 6. 主要错误码

定义位置：

- [errors.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/errors.rs)

当前前端最常见的错误：

### 6004 `InsufficientFunds`

含义：

- EDcoins 不足
- 或 SOL 不足（兑换场景）

### 6006 `RaidAlreadyActive`

含义：

- 玩家已经有一局未结束 raid

### 6007 `InvalidRaidState`

含义：

- 当前指令不允许在这个 raid 状态执行

### 6008 `RaidTimedOut`

含义：

- 当前战局超时，需要按失败结算

### 6009 `InvalidEquipment`

含义：

- 当前护甲参数或武器参数不合法
- 或余额不足以支持这次开局

### 6011 `InvalidContainer`

含义：

- 容器索引错误
- 或该区域容器已经开完

### 6013 `InvalidDifficultyConfig`

含义：

- 难度配置非法

## 7. 前端页面与接口映射

### 首页 `/`

依赖：

- 钱包连接
- `/api/player/[wallet]`

建议展示：

- EDcoins
- armor-point balance
- weapon-point balance

### `/play`

依赖：

- `/api/player/[wallet]`
- `/api/records/[wallet]`
- `/api/tx/start`
- `/api/tx/open`
- `/api/tx/fight`
- `/api/tx/move`
- `/api/tx/extract`
- `/api/tx/fail`
- `/api/tx/purchase-loadout`

### `/warehouse`

当前以 `PlayerProfile` 余额展示为主。

后续若补全仓库资产列表，还要直接查 `WarehouseAsset`。

### `/records`

依赖：

- `/api/records/[wallet]`

### `/marketplace`

当前 scaffold 为主，后续重做时建议直接补：

- listing 列表读取
- 上架
- 购买
- 取消

## 8. session key 接口边界

当前项目的设计边界：

- `connect / start / extract / fail / purchase-loadout`：仍走钱包签名
- `open / fight / move`：支持 session key

也就是说：

- session key 更适合局内连续操作
- 开局和结算依然是高确认度动作

## 9. 当前前端已有调试信息

`/play` 页面当前已内置调试面板，会打印：

- API path
- request
- api response
- signature
- frontend error

这样前端在联调时不需要先翻控制台。

## 10. 给前端的建议

如果前端重做，建议优先遵守这几个原则：

1. 页面状态不要自己发明，优先跟链上 `PlayerProfile.active_raid` 对齐
2. 护甲/武器参数余额必须按 tenths 存取，显示时再转成小数
3. 交易错误要翻译成业务语义，不要直接把 `Custom:6009` 暴露给用户
4. 把 `Start Raid`、`Abandon Raid`、`Extract` 这些高风险动作做成清晰确认动作
5. 局内动作和结算动作分层展示，避免用户混淆

## 11. 关键文件入口

### API 路由

- Connect：[route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/tx/connect/route.ts)
- Start：[route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/tx/start/route.ts)
- Open：[route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/tx/open/route.ts)
- Fight：[route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/tx/fight/route.ts)
- Move：[route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/tx/move/route.ts)
- Extract：[route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/tx/extract/route.ts)
- Fail：[route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/tx/fail/route.ts)
- Purchase Loadout：[route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/tx/purchase-loadout/route.ts)
- Player Query：[route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/player/[wallet]/route.ts)
- Records Query：[route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/records/[wallet]/route.ts)

### 钱包与交易发送

- [provider.tsx](/home/solana/programs/EscapeFromDelta/app/src/wallet/provider.tsx)

### 玩家聚合状态

- [usePlayerProfile.ts](/home/solana/programs/EscapeFromDelta/app/src/wallet/usePlayerProfile.ts)

### 服务端交易构造

- [local-demo.ts](/home/solana/programs/EscapeFromDelta/app/src/lib/local-demo.ts)

### 合约入口

- [lib.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/lib.rs)
