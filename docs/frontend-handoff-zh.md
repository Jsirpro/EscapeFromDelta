# Escape from Delta 前端交接文档

本文给前端开发使用，重点说明：

- 游戏业务逻辑是什么
- 页面应该怎么理解链上状态
- 前端要调用哪些合约指令
- 当前项目里已经存在哪些 API / 页面逻辑
- 对接时有哪些容易踩坑的点

## 1. 项目概览

- 游戏名：`Escape from Delta`
- 链：Solana
- 合约程序 ID：`7ueVgYfrwidjpwMCBfGyHCoVpaVNe7Ep1h2Mxv1ENBYQ`
- 当前前端：Next.js
- 当前合约：Anchor

当前业务分成两大块：

1. `开始游戏 / Raid`
2. `交易系统 / Marketplace`

另有：

- 仓库
- 战绩查询
- 管理员配置

## 2. 核心业务模型

### 2.1 玩家资产

玩家链上主账户是 `PlayerProfile`。

它里面最重要的字段：

- `edcoins_balance`
- `armor_point_balance`
- `weapon_point_balance`
- `active_raid`
- `next_raid_id`

定义位置：

- [mod.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/state/mod.rs)

### 2.2 参数单位

护甲和武器参数在链上不是 float，而是 **tenths**：

- `20` 表示 `2.0`
- `200` 表示 `20.0`

前端显示时要除以 `10`。

当前项目里已有格式化逻辑：

- [player.ts](/home/solana/programs/EscapeFromDelta/clients/src/queries/player.ts)

### 2.3 初始赠送

玩家第一次连接钱包并执行 `create_or_connect_player` 后，获得：

- `20000` EDcoins
- `20.0 armor-point balance`
- `20.0 weapon-point balance`

注意：这里送的是 **余额**，不是某一局直接装备上的值。

### 2.4 当前开局默认消耗

当前 demo 里 `Start Raid` 默认会带：

- 护甲 `2.0`
- 武器 `2.0`
- 入场费 `1000 EDcoins`

也就是链上实际传：

- `armor_tenths = 20`
- `weapon_tenths = 20`
- `entry_fee = 1000`

实现位置：

- [local-demo.ts](/home/solana/programs/EscapeFromDelta/app/src/lib/local-demo.ts)

## 3. 当前新增的参数购买逻辑

为了避免玩家把参数余额用完后无法继续测试，当前已经新增一条链上购买逻辑：

- 使用 EDcoins 购买 `armor-point balance`
- 使用 EDcoins 购买 `weapon-point balance`

### 3.1 当前价格

- 每次购买 `+1.0 armor-point balance`，花费 `1000 EDcoins`
- 每次购买 `+1.0 weapon-point balance`，花费 `1000 EDcoins`

链上常量位置：

- [constants.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/state/constants.rs)

### 3.2 对应合约指令

- `purchase_loadout_points(kind)`

其中 `kind`：

- `Armor`
- `Weapon`

实现位置：

- [purchase_loadout_points.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/instructions/purchase_loadout_points.rs)
- [lib.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/lib.rs)

### 3.3 当前前端入口

`/play` 页面已有两个按钮：

- 购买 `+1.0 护甲`
- 购买 `+1.0 武器`

页面位置：

- [page.tsx](/home/solana/programs/EscapeFromDelta/app/src/app/play/page.tsx)

API 路由：

- [route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/tx/purchase-loadout/route.ts)

## 4. Raid 业务流程

### 4.1 开局前

用户必须先：

1. 连接钱包
2. 完成 `create_or_connect_player`
3. 拥有足够：
   - `EDcoins`
   - `armor-point balance`
   - `weapon-point balance`

### 4.2 Start Raid

点击 `开始行动` 后，当前前端会：

1. 尝试创建 / 复用 session key
2. 调 `/api/tx/start`
3. 钱包签名发送 `start_raid`

如果成功：

- 扣除入场费
- 扣除本局携带的护甲/武器参数
- 创建 `RaidSession`
- `PlayerProfile.active_raid` 指向当前 raid

### 4.3 局内动作

当前局内动作包括：

- `open_container`
- `fight_enemy`
- `move_area`
- `extract_raid`
- `settle_failed_raid`

其中：

- `open_container / fight_enemy / move_area` 设计上支持 session key
- `extract_raid / settle_failed_raid` 仍走玩家钱包签名

### 4.4 主动放弃战局

现在“放弃战局”走的是：

- `settle_failed_raid`

并且已经放宽为允许从这些状态失败结算：

- `Active`
- `PendingBattle`
- `Failed`
- `TimedOut`
- 或超时

文件：

- [settle_failed_raid.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/instructions/settle_failed_raid.rs)

## 5. 交易系统业务逻辑

### 5.1 当前支持卖出的内容

从合约建模看，交易系统主要围绕 `WarehouseAsset`。

类型包括：

- Collectible
- ArmorPoints
- WeaponPoints
- SafeCase

定义位置：

- [mod.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/state/mod.rs)

### 5.2 上架逻辑

- 卖家创建 listing
- 标记价格
- 支付 `3%` 手续费
- 资产被锁定为 `Listed`

文件：

- [create_listing.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/instructions/create_listing.rs)

### 5.3 购买逻辑

- 买家支付 `EDcoins`
- 卖家收款
- 资产 owner 变更
- listing 变为 `Sold`

文件：

- [purchase_listing.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/instructions/purchase_listing.rs)

## 6. 重要链上账户

前端最需要关注的账户有 5 个：

### 6.1 GameConfig

全局配置，包含：

- admin authority
- mint / treasury
- 汇率

### 6.2 PlayerProfile

玩家主状态，前端几乎所有页面都依赖它。

### 6.3 RaidSession

单局 raid 状态。

只要 `PlayerProfile.active_raid` 不为空，就说明玩家有未结束战局。

### 6.4 BattleRecord

战绩页读取这个。

### 6.5 MarketplaceListing

交易页读取这个。

更完整的账户说明看：

- [account-map.md](/home/solana/programs/EscapeFromDelta/specs/001-solana-raid-game/account-map.md)

## 7. 前端如何判断页面状态

### 7.1 首页

依赖：

- 钱包连接状态
- `PlayerProfile`

显示：

- EDcoins 余额
- armor-point balance
- weapon-point balance

### 7.2 `/play`

`/play` 页面要区分这几种状态：

1. 没有 active raid
2. 有 active raid，但还没点“回到战局”
3. 已进入局内
4. 遭遇敌人待战斗
5. 已撤离
6. 已失败

当前本地 UI 状态机文件：

- [raidMachine.ts](/home/solana/programs/EscapeFromDelta/app/src/game/raidMachine.ts)

注意：

- UI 状态机只是页面交互层
- 真正 authoritative 的状态还是链上账户

### 7.3 `/warehouse`

核心读取：

- `PlayerProfile`
- 后续如果补全 `WarehouseAsset` 列表，就从链上查询资产 PDA

### 7.4 `/records`

核心读取：

- `BattleRecord`

当前 API：

- [route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/records/[wallet]/route.ts)

### 7.5 `/admin`

管理员页面只允许部署者 / 管理员钱包操作，当前主要是：

- 创建难度版本

## 8. 当前前端对接方式

### 8.1 当前模式

当前项目不是页面直接拼 Anchor tx，而是：

1. 页面请求 Next API
2. API 在服务端构造 unsigned transaction
3. 前端钱包签名发送

这样做的好处是：

- 页面更轻
- PDA 推导集中在服务端
- 方便插入 demo 逻辑和调试输出

### 8.2 现有交易 API

当前主要 API 有：

- `/api/tx/connect`
- `/api/tx/start`
- `/api/tx/open`
- `/api/tx/fight`
- `/api/tx/move`
- `/api/tx/extract`
- `/api/tx/fail`
- `/api/tx/purchase-loadout`

可读取：

- `/api/player/[wallet]`
- `/api/records/[wallet]`

### 8.3 服务端交易构造入口

主要在：

- [local-demo.ts](/home/solana/programs/EscapeFromDelta/app/src/lib/local-demo.ts)

这个文件负责：

- 取 program
- 推导 PDA
- 构造 transaction
- 返回序列化结果给前端

## 9. 当前前端调试方式

为了方便排查问题，`/play` 页面已经有 `Transaction Debug` 区域。

它会显示：

- path
- request
- API response
- signature
- frontendError

页面位置：

- [page.tsx](/home/solana/programs/EscapeFromDelta/app/src/app/play/page.tsx)

钱包侧调试在：

- [provider.tsx](/home/solana/programs/EscapeFromDelta/app/src/wallet/provider.tsx)

## 10. 前端开发最容易踩的坑

### 10.1 把链上余额当作展示值而不是 authoritative state

必须明确：

- `armor-point balance`
- `weapon-point balance`

都是链上主状态。

页面本地 state 只能做临时 UI 交互，不能代替链上结果。

### 10.2 把 `20.0` 当作本局装备值

不是。

`20.0` 是总余额。
每次开局会消耗一部分。

### 10.3 float 直接上传链上

不要直接传 float。

前端需要统一转换成 tenths：

- `2.0 -> 20`
- `1.5 -> 15`

### 10.4 active raid 判断错误

只要 `PlayerProfile.active_raid` 不为空，就说明链上还有未结算战局。

不要只信本地 reducer。

### 10.5 会话 / session key

当前局内部分动作支持 session key，但开始和结算仍然会走钱包签名。

前端如果重做钱包层，要保留这个边界：

- 开始游戏：签名
- 局内操作：尽量无感
- 结算：签名

## 11. 当前建议的前端重做优先级

如果是交给新的前端开发，建议按这个顺序接：

1. 先把首页、`/play`、`/warehouse`、`/records` 的读取做稳定
2. 再把 `/play` 的战局状态做清楚
3. 再优化 session key 体验
4. 再做 marketplace 的完整视觉和交互
5. 最后再做 admin 页面 polish

## 12. 当前可直接参考的代码入口

### 页面

- 首页：[page.tsx](/home/solana/programs/EscapeFromDelta/app/src/app/page.tsx)
- Play：[page.tsx](/home/solana/programs/EscapeFromDelta/app/src/app/play/page.tsx)
- Warehouse：[page.tsx](/home/solana/programs/EscapeFromDelta/app/src/app/warehouse/page.tsx)
- Records：[page.tsx](/home/solana/programs/EscapeFromDelta/app/src/app/records/page.tsx)
- Marketplace：[page.tsx](/home/solana/programs/EscapeFromDelta/app/src/app/marketplace/page.tsx)
- Admin：[page.tsx](/home/solana/programs/EscapeFromDelta/app/src/app/admin/page.tsx)

### 钱包 / 交易

- 钱包状态：[provider.tsx](/home/solana/programs/EscapeFromDelta/app/src/wallet/provider.tsx)
- 玩家数据聚合：[usePlayerProfile.ts](/home/solana/programs/EscapeFromDelta/app/src/wallet/usePlayerProfile.ts)
- 交易构造：[local-demo.ts](/home/solana/programs/EscapeFromDelta/app/src/lib/local-demo.ts)

### 合约

- 程序入口：[lib.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/lib.rs)
- 状态模型：[mod.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/state/mod.rs)
- 账户设计：[account-map.md](/home/solana/programs/EscapeFromDelta/specs/001-solana-raid-game/account-map.md)

## 13. 一句话总结给前端

这个项目的前端核心不是“做一个页面”，而是：

- 始终把 `PlayerProfile` 作为唯一真实玩家状态
- 用 `active_raid` 驱动 raid 页面
- 把 armor/weapon 参数当成链上余额来消费和补充
- 页面交互层可以漂亮，但绝不能和链上状态脱节
