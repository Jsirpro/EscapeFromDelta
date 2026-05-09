# 战斗失败后无法正确结算的修复说明

## 问题现象

游戏内战斗失败后，常见会出现这两类问题：

1. 页面直接回到“准备状态”
   - 没有明确提示“战斗失败”
   - 看不到“放弃战局”结算入口
   - 战绩页里也没有这一局失败记录

2. 页面进入失败态，但点击“放弃战局”时报错
   - 典型错误：

```text
transaction-failed:{"InstructionError":[2,{"Custom":1}]}
```

或者前端调试信息里是：

- `path: client/tx/fail`
- `stateStatus: failed`
- `onChainActiveRaid` 仍然存在

## 根因拆分

这其实是两层问题。

### 问题 A：战斗失败后链上提前清掉了 active raid

如果 `fight_enemy` 在战斗失败时直接做了这些事情：

- `player_profile.active_raid = None`
- 清掉战局关键状态
- 提前把这局当成“已经结束”

那么前端只会看到：

- 没有活动战局
- 页面直接回准备态

结果就是：

- 没有失败结算入口
- 不会走 `settle_failed_raid`
- 不会创建 `BattleRecord`

### 问题 B：失败结算会创建新账户，需要 SOL

`settle_failed_raid` 不只是改状态，它会：

1. `init` 一个新的 `BattleRecord`
2. 如果安全箱里有保留物，还会创建新的 `WarehouseAsset`

所以这一步需要：

- 玩家钱包支付 rent

如果 devnet 钱包 SOL 不够，就会在“放弃战局”时报错。

常见表现就是：

```text
transaction-failed:{"InstructionError":[2,{"Custom":1}]}
```

## 正确链上行为

战斗失败后，正确流程应该是：

1. `fight_enemy`
2. 如果失败：
   - `raid_session.status = Failed`
   - 保留 `player_profile.active_raid`
   - 不要提前清掉这局
   - 不要提前把战绩结算掉
3. 前端进入失败态
4. 玩家点击 `放弃战局`
5. 调 `settle_failed_raid`
6. 由 `settle_failed_raid`：
   - 生成 `BattleRecord`
   - 创建保留下来的 `WarehouseAsset`
   - 清掉 `player_profile.active_raid`

## 合约修复点

### 文件

- `programs/escape_from_delta/src/instructions/fight_enemy.rs`

### 错误做法

战斗失败时不要在 `fight_enemy` 里直接：

- `player_profile.active_raid = None`
- 清掉整局 loot
- 提前写 `settled_at`

### 正确做法

战斗失败时只做：

- `raid_session.status = RaidStatus::Failed`
- `current_armor_tenths = 0`
- `current_weapon_tenths = 0`
- `pending_loot = None`

但保留：

- `player_profile.active_raid`
- `raid_session.carried_loot`
- 这局等待后续 `settle_failed_raid` 结算

## 前端正确行为

### 失败态按钮逻辑

如果：

- `stateStatus = failed`
- 且 `onChainActiveRaid` 仍然有值

那么页面不应该直接给：

- `重新开始`

而应该优先给：

- `放弃战局`
- `返回主页`

因为这时链上仍有一局失败但未结算的 raid。

只有在：

- `onChainActiveRaid = null`

之后，才应该显示：

- `重新开始`
- `返回主页`

## 关于 `Custom:1`

如果失败态下点击 `放弃战局` 报：

```text
transaction-failed:{"InstructionError":[2,{"Custom":1}]}
```

在这条链路里，优先怀疑：

- 钱包 SOL 不够支付 `BattleRecord` / `WarehouseAsset` 的 rent

因为：

- `open_container / fight_enemy / move_area` 多数只改已有账户
- `settle_failed_raid` 会创建新账户

## 排查命令

### 1. 检查钱包 SOL

```bash
solana balance <WALLET> --url https://api.devnet.solana.com
```

### 2. 空投 devnet SOL

```bash
solana airdrop 2 <WALLET> --url https://api.devnet.solana.com
```

## 给另一个 AI 的最小提示词

```text
问题：战斗失败后页面直接回准备态，或者失败态下点击“放弃战局”不能正确结算。

已知正确逻辑：
- fight_enemy 在失败时不能清掉 player_profile.active_raid
- 失败时只能把 raid_session.status 设为 Failed，等待后续 settle_failed_raid 结算
- BattleRecord 必须由 settle_failed_raid 创建，不应在 fight_enemy 里被绕过

请优先检查：
1. programs/escape_from_delta/src/instructions/fight_enemy.rs
2. 战斗失败分支里是否错误地清掉了 active_raid
3. app/src/app/play/page.tsx 失败态是否先显示“放弃战局”
4. settle_failed_raid 是否仍允许从 Failed 状态结算

补充：
- 如果点击“放弃战局”报 Custom:1，优先检查是否是钱包 SOL 不足导致创建 BattleRecord / WarehouseAsset 失败
```

## 验收标准

修完后要满足：

1. 战斗失败后，页面停在失败态
2. 页面显示 `放弃战局`
3. 点击 `放弃战局` 后，失败结算成功
4. 这局失败战绩能出现在战绩页
5. 结算后才回到准备态
