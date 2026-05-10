// 35 件藏品的静态目录:中英文名 + 描述 + 图片路径 + 稀有度。
// 与 scripts/generate_collectibles.py 保持一一对应。
// 键格式 `${rarity}_${index:02d}` 与链上 collectibleCode 完全一致。

export type CollectibleRarity = "legendary" | "epic" | "rare";

export interface CollectibleMeta {
  code: string;           // e.g. "legendary_05"
  rarity: CollectibleRarity;
  serial: number;         // 1-based within rarity
  nameCn: string;
  nameEn: string;
  descriptionCn: string;
  descriptionEn: string;
  image: string;          // public path, e.g. "/collectibles/legendary/05_7day-market-maker-card.png"
}

const LEGENDARY: Array<Omit<CollectibleMeta, "code" | "rarity">> = [
  {
    serial: 1,
    nameCn: "私钥破解器",
    nameEn: "Private Key Cracker",
    descriptionCn: "传说中可以破解一切钱包的神器,唯一的问题是——你不知道它什么时候在破解你的钱包。",
    descriptionEn: "A legendary tool said to crack any wallet. The only problem is—you never know when it's cracking yours.",
    image: "/collectibles/legendary/01_private-key-cracker.png",
  },
  {
    serial: 2,
    nameCn: "非洲之心",
    nameEn: "Heart of Africa",
    descriptionCn: "价值连城的红色宝石,据说只有真正的“长期持有者”才配拥有它。",
    descriptionEn: "A priceless red gemstone. Rumor says only true “long-term holders” deserve to own it.",
    image: "/collectibles/legendary/02_heart-of-africa.png",
  },
  {
    serial: 3,
    nameCn: "一折 BTC 购买权",
    nameEn: "90% Off BTC Coupon",
    descriptionCn: "限时一次,错过即永远错过。大多数人选择再等等更低点。",
    descriptionEn: "One-time limited offer. Miss it, and it's gone forever. Most people choose to wait for an even lower dip.",
    image: "/collectibles/legendary/03_90-off-btc-coupon.png",
  },
  {
    serial: 4,
    nameCn: "9090 显卡",
    nameEn: "RTX 9090 GPU",
    descriptionCn: "不存在的型号,但矿老板说它一天能回本三次。",
    descriptionEn: "A GPU model that doesn't exist, but mining farm owners claim it pays itself back three times a day.",
    image: "/collectibles/legendary/04_rtx-9090-gpu.png",
  },
  {
    serial: 5,
    nameCn: "七天庄家体验卡",
    nameEn: "7-Day Market Maker Card",
    descriptionCn: "短暂体验控盘的快乐,第七天结束后你会明白为什么散户永远是散户。",
    descriptionEn: "Briefly experience the joy of market manipulation. By Day 7, you'll finally understand why retail traders always lose.",
    image: "/collectibles/legendary/05_7day-market-maker-card.png",
  },
];

const EPIC: Array<Omit<CollectibleMeta, "code" | "rarity">> = [
  {
    serial: 1,
    nameCn: "黄金抄底手",
    nameEn: "Golden Bottom-Catching Hand",
    descriptionCn: "总能精准抄在“阶段性底部”,只是阶段有点长。",
    descriptionEn: "Always catches the “local bottom” perfectly. The only issue is—the phase lasts a bit too long.",
    image: "/collectibles/epic/01_golden-bottom-hand.png",
  },
  {
    serial: 2,
    nameCn: "内存条",
    nameEn: "RAM Stick",
    descriptionCn: "用来存储你的交易策略,不过通常只记录亏损记录。",
    descriptionEn: "Used to store your trading strategies, though it mostly records your losses.",
    image: "/collectibles/epic/02_ram-stick.png",
  },
  {
    serial: 3,
    nameCn: "硬盘",
    nameEn: "Mysterious Hard Drive",
    descriptionCn: "据说里面有早期钱包备份,但你永远找不到正确的文件夹。",
    descriptionEn: "Supposedly contains an early wallet backup, but you'll never find the correct folder.",
    image: "/collectibles/epic/03_hard-drive.png",
  },
  {
    serial: 4,
    nameCn: "Meme 币图腾",
    nameEn: "Meme Coin Totem",
    descriptionCn: "围绕它祈祷,下一只狗狗币或许会降临。",
    descriptionEn: "Pray around it, and perhaps the next Dogecoin will descend upon you.",
    image: "/collectibles/epic/04_meme-coin-totem.png",
  },
  {
    serial: 5,
    nameCn: "劳力士手表",
    nameEn: "Rolex Watch",
    descriptionCn: "不是用来看时间的,是用来证明你“曾经赚过钱”的。",
    descriptionEn: "Not for telling time, but for proving you “used to make money.”",
    image: "/collectibles/epic/05_rolex-watch.png",
  },
  {
    serial: 6,
    nameCn: "交易所自定义按钮",
    nameEn: "Custom Exchange Button",
    descriptionCn: "强大的自定义功能:申请未成年退款、模拟盘提现、随时更改杠杆。",
    descriptionEn: "Powerful customization features: request underage refunds, withdraw from demo accounts, change leverage anytime.",
    image: "/collectibles/epic/06_custom-exchange-button.png",
  },
  {
    serial: 7,
    nameCn: "FOMO 之眼",
    nameEn: "Eye of FOMO",
    descriptionCn: "一旦睁开,你将无法错过任何一个已经涨完的机会。",
    descriptionEn: "Once opened, you'll never miss another opportunity that already pumped.",
    image: "/collectibles/epic/07_eye-of-fomo.png",
  },
  {
    serial: 8,
    nameCn: "牛熊转换罗盘",
    nameEn: "Bull-Bear Compass",
    descriptionCn: "永远指向刚刚结束的趋势。",
    descriptionEn: "Always points toward the trend that just ended.",
    image: "/collectibles/epic/08_bull-bear-compass.png",
  },
  {
    serial: 9,
    nameCn: "空投信标",
    nameEn: "Airdrop Beacon",
    descriptionCn: "吸引空投的神器,前提是你真的符合条件。",
    descriptionEn: "A sacred device that attracts airdrops—assuming you actually qualify.",
    image: "/collectibles/epic/09_airdrop-beacon.png",
  },
  {
    serial: 10,
    nameCn: "暴跌预言机",
    nameEn: "Crash Oracle",
    descriptionCn: "每次你加仓后,它都会精准触发。",
    descriptionEn: "Every time you add to your position, it triggers with perfect accuracy.",
    image: "/collectibles/epic/10_crash-oracle.png",
  },
];

const RARE: Array<Omit<CollectibleMeta, "code" | "rarity">> = [
  {
    serial: 1,
    nameCn: "破损背包扣",
    nameEn: "Broken Backpack Clip",
    descriptionCn: "看似没用,但总感觉丢了它会更亏。",
    descriptionEn: "Looks useless, but somehow losing it feels like losing even more money.",
    image: "/collectibles/rare/01_broken-backpack-clip.png",
  },
  {
    serial: 2,
    nameCn: "神秘二维码",
    nameEn: "Mysterious QR Code",
    descriptionCn: "原来这是作者的收款地址。",
    descriptionEn: "Turns out it's just the creator's donation address.",
    image: "/collectibles/rare/02_mysterious-qr-code.png",
  },
  {
    serial: 3,
    nameCn: "半张纸条",
    nameEn: "Half a Note",
    descriptionCn: "在夹层里发现的,上面写着 6 个单词……",
    descriptionEn: "Found hidden in a compartment. Only six words remain written on it...",
    image: "/collectibles/rare/03_half-note.png",
  },
  {
    serial: 4,
    nameCn: "摄像头",
    nameEn: "Webcam",
    descriptionCn: "你以为它在监控别人,其实它一直在看你操作。",
    descriptionEn: "You think it's watching others, but it has been watching your trades all along.",
    image: "/collectibles/rare/04_webcam.png",
  },
  {
    serial: 5,
    nameCn: "蓝色内裤(战损版)",
    nameEn: "Battle-Damaged Blue Underwear",
    descriptionCn: "跟随开发者六余年,征战沙场,最后却配不上传奇收藏品 :)",
    descriptionEn: "Followed the developer for over six years through countless battles, yet still unworthy of becoming a Legendary collectible :)",
    image: "/collectibles/rare/05_battle-damaged-underwear.png",
  },
  {
    serial: 6,
    nameCn: "加密 U 盘",
    nameEn: "Encrypted USB Drive",
    descriptionCn: "插进去之前你很紧张,插进去之后你更紧张。",
    descriptionEn: "You're nervous before plugging it in. Even more nervous afterward.",
    image: "/collectibles/rare/06_encrypted-usb.png",
  },
  {
    serial: 7,
    nameCn: "法拉利钥匙",
    nameEn: "Ferrari Key",
    descriptionCn: "车不在,梦还在。",
    descriptionEn: "The car is gone, but the dream remains.",
    image: "/collectibles/rare/07_ferrari-key.png",
  },
  {
    serial: 8,
    nameCn: "最后 10U",
    nameEn: "Last 10 USDT",
    descriptionCn: "“老师这是最后 10U 了,别说那么多了,梭哈哪边?”",
    descriptionEn: "“Teacher, this is my last 10U. Enough talk—where do I all-in?”",
    image: "/collectibles/rare/08_last-10-usdt.png",
  },
  {
    serial: 9,
    nameCn: "交易签名笔",
    nameEn: "Trading Signature Pen",
    descriptionCn: "签下的不是交易,是命运。",
    descriptionEn: "You're not signing trades—you're signing your fate.",
    image: "/collectibles/rare/09_signature-pen.png",
  },
  {
    serial: 10,
    nameCn: "老鼠仓按钮",
    nameEn: "Insider Trading Button",
    descriptionCn: "按下去之前你是观众,按下去之后你是参与者。",
    descriptionEn: "Before pressing it, you're a spectator. After pressing it, you're a participant.",
    image: "/collectibles/rare/10_insider-button.png",
  },
  {
    serial: 11,
    nameCn: "梭哈按钮(已损坏)",
    nameEn: "All-In Button (Broken)",
    descriptionCn: "它曾经改变过很多人的人生,现在只是个提醒。",
    descriptionEn: "It once changed countless lives. Now it merely serves as a warning.",
    image: "/collectibles/rare/11_broken-allin-button.png",
  },
  {
    serial: 12,
    nameCn: "套牢证明书",
    nameEn: "Bagholder Certificate",
    descriptionCn: "官方认证,长期持有者。",
    descriptionEn: "Officially certified long-term holder.",
    image: "/collectibles/rare/12_bagholder-certificate.png",
  },
  {
    serial: 13,
    nameCn: "泡着枸杞的保温杯",
    nameEn: "Wolfberry Thermos",
    descriptionCn: "一边养生,一边爆仓。",
    descriptionEn: "Staying healthy while getting liquidated.",
    image: "/collectibles/rare/13_wolfberry-thermos.png",
  },
  {
    serial: 14,
    nameCn: "加密磁带",
    nameEn: "Encrypted Cassette Tape",
    descriptionCn: "需要特殊设备读取,而设备早已停产。",
    descriptionEn: "Requires special equipment to read, but the equipment has long been discontinued.",
    image: "/collectibles/rare/14_encrypted-cassette.png",
  },
  {
    serial: 15,
    nameCn: "钱包备份卡",
    nameEn: "Wallet Backup Card",
    descriptionCn: "你以为你备份了,其实你只是安心了。",
    descriptionEn: "You thought you backed it up. In reality, you just reassured yourself.",
    image: "/collectibles/rare/15_wallet-backup-card.png",
  },
  {
    serial: 16,
    nameCn: "韭菜种子",
    nameEn: "Leek Seeds",
    descriptionCn: "种下去不会发芽,但会长出新的韭菜。",
    descriptionEn: "They won't sprout, but somehow they grow new retail investors instead.",
    image: "/collectibles/rare/16_leek-seeds.png",
  },
  {
    serial: 17,
    nameCn: "拉盘号角",
    nameEn: "Pumping Horn",
    descriptionCn: "吹响之前寂静无声,吹响之后你已经来不及。",
    descriptionEn: "Silent before it blows. Too late once it does.",
    image: "/collectibles/rare/17_pumping-horn.png",
  },
  {
    serial: 18,
    nameCn: "实体比特币",
    nameEn: "Physical Bitcoin",
    descriptionCn: "在兜里放了一会,拿出来变成巧克力了。",
    descriptionEn: "Kept it in your pocket for a while. Took it out and it turned into chocolate.",
    image: "/collectibles/rare/18_physical-bitcoin-chocolate.png",
  },
  {
    serial: 19,
    nameCn: "鼠标",
    nameEn: "Fate Mouse",
    descriptionCn: "决定命运的不是行情,是你点下去的那一瞬间。",
    descriptionEn: "Your fate isn't decided by the market—it's decided the moment you click.",
    image: "/collectibles/rare/19_fate-mouse.png",
  },
  {
    serial: 20,
    nameCn: "“新鲜”的汉堡",
    nameEn: "“Fresh” Hamburger",
    descriptionCn: "生产日期:2001 年 7 月。配料表:苯甲酸及其钠盐、丙酸及其钙盐等等的科技与狠活儿。",
    descriptionEn: "Production Date: July 2001. Ingredients: Sodium benzoate, calcium propionate, and many other miracles of modern food science.",
    image: "/collectibles/rare/20_fresh-hamburger.png",
  },
];

function build(rarity: CollectibleRarity, list: Array<Omit<CollectibleMeta, "code" | "rarity">>): CollectibleMeta[] {
  return list.map((item) => ({
    ...item,
    rarity,
    code: `${rarity}_${String(item.serial).padStart(2, "0")}`,
  }));
}

export const COLLECTIBLES: CollectibleMeta[] = [
  ...build("legendary", LEGENDARY),
  ...build("epic", EPIC),
  ...build("rare", RARE),
];

const BY_CODE = new Map(COLLECTIBLES.map((item) => [item.code, item]));

export function getCollectibleByCode(code: string | null | undefined): CollectibleMeta | undefined {
  if (!code) return undefined;
  return BY_CODE.get(code);
}

export function getCollectibleByRaritySerial(rarity: CollectibleRarity, serial: number): CollectibleMeta | undefined {
  return BY_CODE.get(`${rarity}_${String(serial).padStart(2, "0")}`);
}
