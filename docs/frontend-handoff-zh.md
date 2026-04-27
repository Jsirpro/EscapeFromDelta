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
- 另外叠加安全箱费用：
  - `0` 格：`0 EDcoins`
  - `1` 格：`500 EDcoins`
  - `2` 格：`1000 EDcoins`
  - `3` 格：`1500 EDcoins`

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

- 当前不是固定 `+1.0`
- 前端可输入购买多少参数，支持 `0.1` 步进
- 价格规则是：
  - `1000 EDcoins / 1.0 armor-point balance`
  - `1000 EDcoins / 1.0 weapon-point balance`

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

`/play` 页面当前是两个输入框加两个按钮：

- `购买护甲参数`
- `购买武器参数`

前端会实时显示本次购买价格，并在 `EDcoins` 不足时禁用按钮。

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

当前开局不再等服务端确认 `activeRaid` 再切 UI。  
`start_raid` 交易成功后，`/play` 会直接进入局内状态，再异步刷新链上状态。

### 4.3 局内动作

当前局内动作包括：

- `open_container`
- `fight_enemy`
- `move_area`
- `select_safe_case_items`
- `extract_raid`
- `settle_failed_raid`

其中：

- `open_container / fight_enemy / move_area / select_safe_case_items` 当前只走 session key
- `extract_raid / settle_failed_raid` 仍走玩家钱包签名
- 如果 session token 无效，前端会报 session 相关错误，不再回退到钱包直签局内动作

### 4.4 当前测试模式

当前代码为了方便测试，链上常量被改成：

- `100%` 遇敌
- `100%` 战斗胜利

只对**新开的 raid**生效。旧战局不会自动切换到这个测试模式。

### 4.5 当前容器掉落时序

现在的掉落逻辑是：

1. `open_container`
2. 如果不遇敌，直接把物品写入 `carried_loot`
3. 如果遇敌，先把本次掉落挂到 `pending_loot`
4. `fight_enemy` 胜利后，再把 `pending_loot` 写入 `carried_loot`
5. 失败则拿不到这次容器物品

对应文件：

- [open_container.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/instructions/open_container.rs)
- [fight_enemy.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/instructions/fight_enemy.rs)

### 4.6 主动放弃战局

现在“放弃战局”走的是：

- `settle_failed_raid`

并且已经放宽为允许从这些状态失败结算：

- `Active`
- `PendingBattle`
- `Failed`
- `TimedOut`
- 或超时

当前 `/play` 页里的“放弃战局”不再走 `/api/tx/fail`，而是浏览器端直接构造 `settle_failed_raid` 交易并钱包签名发送。  
这样做是为了绕开 Next dev server 在 `/api/tx/fail` 路径上的 OOM 问题。

文件：

- [settle_failed_raid.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/instructions/settle_failed_raid.rs)
- [provider.tsx](/home/solana/programs/EscapeFromDelta/app/src/wallet/provider.tsx)

## 5. 安全箱逻辑

### 5.1 当前开局选择

开局前可以选择：

- 不购买
- `1` 格
- `2` 格
- `3` 格

前端位置：

- [SafeCaseSelection.tsx](/home/solana/programs/EscapeFromDelta/app/src/game/SafeCaseSelection.tsx)
- [page.tsx](/home/solana/programs/EscapeFromDelta/app/src/app/play/page.tsx)

### 5.2 当前保留机制

当前已经不是自动保留最早掉落的前 N 件。  
现在是：

1. 你先购买安全箱容量
2. 局内获得 loot 后
3. 逐件点击：
   - `放入安全箱`
   - `移出安全箱`
4. 失败结算时，只保留 `safe_case_selection` 里的物品

对应链上指令：

- `select_safe_case_items(selected_assets, capacity)`

对应文件：

- [select_safe_case_items.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/instructions/select_safe_case_items.rs)
- [route.ts](/home/solana/programs/EscapeFromDelta/app/src/app/api/tx/safe-case/route.ts)

## 6. 前端当前读取方式

### 6.1 `/play` 页

`/play` 当前已经不再通过 Next API route 读取 `PlayerProfile / RaidSession`。

现在是浏览器端直接用 RPC 读取：

- `PlayerProfile`
- 当前 `RaidSession`

文件：

- [onchain.ts](/home/solana/programs/EscapeFromDelta/app/src/lib/onchain.ts)
- [usePlayerProfile.ts](/home/solana/programs/EscapeFromDelta/app/src/wallet/usePlayerProfile.ts)

这样做是为了绕开 Next dev server 在服务端读链路上的 OOM。

### 6.2 `/records` 与 `/warehouse`

战绩和仓库仍然会使用 records 数据源，仓库当前是从 battle records 的 `retainedAssets` 聚合展示收藏品。

## 7. 交易系统业务逻辑

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

## 8. 重要链上账户

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

当前项目已经不是单一的“全都走 Next API 构造交易”模式，而是混合模式：

1. 大部分交易仍然是页面请求 Next API
2. API 在服务端构造 unsigned transaction
3. 前端钱包或 session key 负责签名发送
4. `/play` 的链上状态读取，以及失败结算交易，已经改成浏览器端直连 RPC / 浏览器端直构交易

这样做的原因是：

- `/play` 高频读链时，Next dev server 曾在服务端读链路上 OOM
- `PlayerProfile / RaidSession` 放到浏览器端直读更稳
- `settle_failed_raid` 放到浏览器端直构可以绕开 `/api/tx/fail` 的高压路径

### 8.2 现有交易 API

当前主要 API 有：

- `/api/tx/connect`
- `/api/tx/start`
- `/api/tx/open`
- `/api/tx/fight`
- `/api/tx/move`
- `/api/tx/extract`
- `/api/tx/fail`
- `/api/tx/safe-case`
- `/api/tx/purchase-loadout`

可读取：

- `/api/player/[wallet]`
- `/api/records/[wallet]`

但要注意：

- `/play` 当前已经**不再依赖** `/api/player/[wallet]`
- `/play` 的失败结算当前也**不再依赖** `/api/tx/fail`
- 这两个接口仍然保留，更多是给其它页面、调试、或后续重构使用

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
