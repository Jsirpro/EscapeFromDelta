# WarehouseAsset 落库实现说明

这份文档说明当前“交易系统第一步”是如何从技术上实现的。

目标是把：

- `成功撤离后的 retained loot`
- `失败结算后安全箱保住的 retained loot`

真正落成链上的 `WarehouseAsset`，而不是只写进 `BattleRecord`。

## 1. 这一步解决的问题

在之前的实现里：

- 战局内 loot 会进入 `RaidSession.carried_loot`
- 结算后 `BattleRecord.retained_assets` 会记录这些 loot
- 仓库页只是从 `BattleRecord` 聚合展示收藏品

这意味着：

- 有“展示出来的物品”
- 但没有“真实可交易资产账户”

交易系统要形成闭环，必须让成功带出的 loot 真正落成 `WarehouseAsset`。

## 2. 当前实现思路

### 2.1 在结算指令里创建资产

现在资产创建发生在两条链上结算指令中：

- [extract_raid.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/instructions/extract_raid.rs)
- [settle_failed_raid.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/instructions/settle_failed_raid.rs)

规则是：

- `extract_raid`
  - 为 `raid_session.carried_loot` 里的每一件 loot 创建 `WarehouseAsset`

- `settle_failed_raid`
  - 只为 `raid_session.safe_case_selection` 里的 loot 创建 `WarehouseAsset`

失败时没放进安全箱的 loot 仍然只会进入 `BattleRecord.lost_assets`，不会落库。

### 2.2 为什么用 `remaining_accounts`

一局 raid 保留下来的 loot 数量是不固定的。  
而 Anchor `Accounts` 结构体需要静态账户列表。

所以这里用了标准做法：

- `ExtractRaid` / `SettleFailedRaid` 的固定账户里只保留：
  - `player`
  - `player_profile`
  - `raid_session`
  - `battle_record`
  - `system_program`

- 需要新建的 `WarehouseAsset` PDA 通过 `ctx.remaining_accounts` 传入

这样可以按 retained loot 的数量动态创建任意个资产账户。

## 3. 链上 helper 的实现

公共逻辑抽到了：

- [warehouse_asset_helpers.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/instructions/warehouse_asset_helpers.rs)

核心函数：

- `create_collectible_assets_from_loot(...)`

它会做这些事：

1. 检查 `remaining_accounts.len() >= retained_loot.len()`
2. 以 `PlayerProfile.warehouse_nonce` 为基准分配新的 `asset_id`
3. 为每件 retained loot 推导 `WarehouseAsset` PDA：
   - seed = `["asset", player_profile, asset_id_le_bytes]`
4. 校验传入的 account 是否等于预期 PDA
5. 通过 `invoke_signed(create_account)` 创建链上账户
6. 把 `WarehouseAsset` 结构序列化写入账户数据
7. 更新 `player_profile.warehouse_nonce`

## 4. 当前 `WarehouseAsset` 写入的字段

本次落库默认写入：

- `asset_type = Collectible`
- `quality = Rare / Epic / Legendary`
- `owner_profile = 当前玩家`
- `tradable = true`
- `locked_state = Available`
- `created_from = 1`

其中品质不是随机重算，而是按 loot pubkey 做稳定映射，和当前前端展示逻辑保持一致：

- `< 8` -> `Legendary`
- `< 30` -> `Epic`
- 其余 -> `Rare`

对应代码在：

- [warehouse_asset_helpers.rs](/home/solana/programs/EscapeFromDelta/programs/escape_from_delta/src/instructions/warehouse_asset_helpers.rs)

## 5. 为什么 `BattleRecord.retained_assets` 还保留原来的 loot pubkey

当前这一步没有把 `BattleRecord.retained_assets` 改成 `WarehouseAsset` 地址，原因是兼容现有页面：

- `/warehouse` 目前还是从 `BattleRecord.retainedAssets` 聚合展示收藏品
- `/records` 也还在直接显示 `retainedAssets / lostAssets`

如果这里直接改成 `WarehouseAsset` PDA：

- 现有前端展示会立刻换成另一套 pubkey
- 收藏品名称映射也会变

所以当前策略是：

- `BattleRecord` 继续记录原始 loot pubkey，用来兼容现有展示
- `WarehouseAsset` 同时真实落库，用于后续交易系统闭环

这是一种过渡态，不是最终形态。

## 6. 结算交易构造为什么也要改

只改合约还不够。  
因为结算交易必须把要创建的 `WarehouseAsset` PDA 一起带上。

所以这次同步修改了两条交易构造路径：

### 6.1 服务端 settlement builder

文件：

- [local-demo.ts](/home/solana/programs/EscapeFromDelta/app/src/lib/local-demo.ts)

现在在构造：

- `extract_raid`
- `settle_failed_raid`

时，会先读取：

- `player_profile.warehouse_nonce`
- `raid_session.carried_loot`
- 或 `raid_session.safe_case_selection`

然后推导出这次需要创建的全部 `WarehouseAsset` PDA，并作为 `remainingAccounts` 附加到交易里。

### 6.2 浏览器端失败结算 builder

文件：

- [provider.tsx](/home/solana/programs/EscapeFromDelta/app/src/wallet/provider.tsx)

当前 `/play` 的“放弃战局”走的是浏览器端直构 `settle_failed_raid`。  
这条路径也同步补了 `remainingAccounts`，否则失败结算时不会创建 `WarehouseAsset`。

## 7. 当前这一步的边界

这一步只做了“真实落库”，还没做：

1. 直接查询 `WarehouseAsset` 列表
2. `/warehouse` 按 `WarehouseAsset` 渲染
3. 从仓库选择某件资产上架
4. 用 `WarehouseAsset` 完整驱动 marketplace

所以现在的状态是：

- `WarehouseAsset` 已经会在结算时真实创建
- 但前端仓库和交易页还没有完全切到这条真实资产链路

## 8. 下一步建议

从交易系统实现顺序看，下一步应该做：

1. 增加 `WarehouseAsset` 查询与解码
2. `/warehouse` 改成直接读取真实资产账户
3. 上架时从 `WarehouseAsset` 里选择资产

这样就能把“链上落库”真正接到“仓库可见”和“市场可卖”上。
