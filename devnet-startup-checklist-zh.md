# Escape from Delta 队友本地启动与排障清单

这份文档给 clone 仓库后需要直接运行前端、连接 devnet 合约的小伙伴。

目标是让对方做到：

1. `npm install`
2. 配好 `.env.local`
3. `npm run dev`
4. 钱包连接成功
5. 能正常开始一局 raid

## 1. 前提

当前项目默认依赖：

- Solana `devnet`
- 已部署的游戏程序
- Session Keys program
- Phantom 钱包

当前游戏程序 ID：

- `7ueVgYfrwidjpwMCBfGyHCoVpaVNe7Ep1h2Mxv1ENBYQ`

Session Keys program ID：

- `KeyspM2ssCJbqUhQ4k7sveSiY4WjnYsrXkC8oDbwde5`

## 2. 本地最小启动步骤

### 2.1 安装依赖

在仓库根目录执行：

```bash
npm install
```

### 2.2 配置环境变量

在仓库根目录创建 `.env.local`，至少写入：

```bash
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_PROGRAM_ID=7ueVgYfrwidjpwMCBfGyHCoVpaVNe7Ep1h2Mxv1ENBYQ

RPC_URL=https://api.devnet.solana.com
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
```

如果项目中某些服务端交易构造路径需要本机钱包，再额外配置：

```bash
ANCHOR_WALLET=~/.config/solana/id.json
```

## 3. 启动前端

```bash
npm run dev
```

浏览器打开：

```text
http://localhost:3000
```

或：

```text
http://127.0.0.1:3000
```

## 4. Phantom 钱包要求

必须满足：

- 已安装 Phantom 扩展
- 网络切到 `devnet`
- 钱包里有 devnet SOL

如果没有 SOL，可执行：

```bash
solana airdrop 2 <你的钱包地址> --url https://api.devnet.solana.com
```

## 5. 这套项目当前的真实运行方式

不是纯前端静态页面，运行时会依赖：

- devnet 上的游戏程序
- devnet 上的 Session Keys program
- 前端钱包签名
- session key 创建与局内授权

当前大致流程是：

1. `Connect Wallet`
2. 创建或连接玩家资料
3. `Start Raid`
4. 创建或复用 session key
5. 局内动作通过 session key 执行

## 6. 最常见的启动失败原因

### 6.1 `.env.local` 没配对

最常见的问题就是：

- `NEXT_PUBLIC_PROGRAM_ID` 错了
- RPC 不是 `devnet`
- 改完 env 没重启前端

改完以后必须：

```bash
pkill -f "next dev"
npm run dev
```

### 6.2 Phantom 不在 devnet

如果钱包网络还在 mainnet 或其他自定义网络，前端会出现：

- 钱包能连上
- 但交易模拟失败
- 或 session/create 失败

### 6.3 钱包没有 devnet SOL

没有 SOL 会导致：

- 连接后第一笔交易失败
- session/create 失败
- start raid 失败

### 6.4 本地跑的是旧前端 bundle

如果前端逻辑刚更新过，但浏览器还是缓存旧 bundle，表现会很混乱。

建议：

1. 重启 `next dev`
2. 浏览器强刷

macOS：

```text
Cmd + Shift + R
```

Windows / Linux：

```text
Ctrl + Shift + R
```

## 7. “Start Raid 时 session/create 报错”怎么排查

如果前端在点击 `开始行动` 时，`Transaction Debug` 显示：

```json
{
  "path": "session/create"
}
```

并报错：

```text
Simulation failed: Attempt to load a program that does not exist
```

这通常不是业务逻辑问题，而是当前连接的链上缺少所需 program。

### 7.1 先确认 env

重点确认：

```bash
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_PROGRAM_ID=7ueVgYfrwidjpwMCBfGyHCoVpaVNe7Ep1h2Mxv1ENBYQ
RPC_URL=https://api.devnet.solana.com
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
```

### 7.2 直接检查 program 是否存在

执行：

```bash
solana program show 7ueVgYfrwidjpwMCBfGyHCoVpaVNe7Ep1h2Mxv1ENBYQ --url https://api.devnet.solana.com
solana account KeyspM2ssCJbqUhQ4k7sveSiY4WjnYsrXkC8oDbwde5 --url https://api.devnet.solana.com
```

预期：

- 第一条能查到游戏程序
- 第二条能查到 Session Keys program 账户

如果任意一个查不到，前端一定跑不通。

## 8. 推荐给队友的最小检查顺序

如果队友说“连接钱包可以，但开始战局不行”，按这个顺序查：

1. Phantom 是否切到 `devnet`
2. 钱包是否有 devnet SOL
3. `.env.local` 是否和本文一致
4. `NEXT_PUBLIC_PROGRAM_ID` 是否等于当前 devnet 部署的程序 ID
5. `solana program show` 是否能查到游戏程序
6. `solana account` 是否能查到 Session Keys program
7. 改完 env 后是否重启过 `npm run dev`
8. 浏览器是否强刷过

## 9. 如果仍然失败，要反馈什么信息

请让对方把下面信息一起发回来：

1. `Transaction Debug` 全部内容
2. `Play State Debug` 全部内容
3. `.env.local` 里这几个值：
   - `NEXT_PUBLIC_RPC_URL`
   - `NEXT_PUBLIC_SOLANA_CLUSTER`
   - `NEXT_PUBLIC_PROGRAM_ID`
4. 下面两条命令的输出：

```bash
solana program show 7ueVgYfrwidjpwMCBfGyHCoVpaVNe7Ep1h2Mxv1ENBYQ --url https://api.devnet.solana.com
solana account KeyspM2ssCJbqUhQ4k7sveSiY4WjnYsrXkC8oDbwde5 --url https://api.devnet.solana.com
```

这样基本就能判断是：

- env 配置错
- 钱包网络错
- program 不存在
- session key 创建失败
- 或前端 bundle 没更新
