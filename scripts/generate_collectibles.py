#!/usr/bin/env python3
"""
批量生成《逃离 Delta》战利品藏品图片 (35 件)。

使用方式:
    export OPENAI_API_KEY=sk-xxx
    # 可选:自定义 base_url (Azure / 中转 / 代理)
    # export OPENAI_BASE_URL=https://xxx/v1
    python scripts/generate_collectibles.py

    # 只跑传奇:
    python scripts/generate_collectibles.py --tier legendary
    # 只跑某一件 (按中文名模糊匹配):
    python scripts/generate_collectibles.py --only 七天
    # 并发数 / 尺寸 / 质量:
    python scripts/generate_collectibles.py --concurrency 4 --size 1024x1024 --quality high
    # 干跑,只打印 prompt 不调 API:
    python scripts/generate_collectibles.py --dry-run

输出目录: assets/collectibles/<tier>/<index>_<slug>.png
"""
from __future__ import annotations

import argparse
import base64
import concurrent.futures as futures
import dataclasses
import json
import os
import sys
import time
from pathlib import Path
from typing import Literal

try:
    from openai import OpenAI
except ImportError:
    sys.exit("缺少依赖,请先: pip install openai>=1.40.0")


# ----------------------------- 数据:35 件藏品 -----------------------------

Tier = Literal["legendary", "epic", "rare"]


@dataclasses.dataclass(frozen=True)
class Collectible:
    index: int
    tier: Tier
    name_cn: str
    name_en: str
    subject: str  # 英文主体描述 (喂给模型)
    slug: str


LEGENDARY: list[Collectible] = [
    Collectible(1, "legendary", "私钥破解器", "Private Key Cracker",
        "a sinister mechanical device shaped like a cross between a lockpick gun and a USB hacking tool, "
        "translucent chassis revealing glowing circuit boards inside, a tiny screen scrolling hex strings, "
        "sharp metallic probe tip, dripping ominous red data particles",
        "private-key-cracker"),
    Collectible(2, "legendary", "非洲之心", "Heart of Africa",
        "a massive faceted blood-red gemstone shaped like a heart, internal fire glow, "
        "sitting on an ornate golden claw mount, refracting crimson light rays outward",
        "heart-of-africa"),
    Collectible(3, "legendary", "一折 BTC 购买权", "90% Off BTC Coupon",
        "a premium holographic coupon card with giant '-90% BTC' embossed gold text, "
        "bitcoin logo watermark, golden foil border, torn-ticket edge, floating with glowing orange sparks",
        "90-off-btc-coupon"),
    Collectible(4, "legendary", "9090 显卡", "RTX 9090 GPU",
        "a futuristic oversized graphics card labeled 'RTX 9090', triple-fan cooler, "
        "RGB underglow, chrome shroud, mining-rig aesthetic, heat shimmer rising off it",
        "rtx-9090-gpu"),
    Collectible(5, "legendary", "七天庄家体验卡", "7-Day Market Maker Card",
        "a luxurious black VIP card with embossed golden text '7 DAYS MARKET MAKER', "
        "golden crown icon at top, candlestick chart pattern etched faintly across the surface, "
        "metallic bezel, soft red inner glow",
        "7day-market-maker-card"),
]

EPIC: list[Collectible] = [
    Collectible(1, "epic", "黄金抄底手", "Golden Bottom-Catching Hand",
        "a golden mechanical robotic hand reaching downward, fingers pinching a tiny descending red candlestick, "
        "polished gold plating with visible joints and hydraulic details",
        "golden-bottom-hand"),
    Collectible(2, "epic", "内存条", "RAM Stick",
        "a high-end DDR5 RAM stick with a purple heatspreader, tiny OLED screen on it showing red PnL numbers, "
        "RGB edge lighting, gold contact pins at the bottom",
        "ram-stick"),
    Collectible(3, "epic", "硬盘", "Mysterious Hard Drive",
        "a vintage 3.5 inch hard drive partially opened, platters visible, a faint bitcoin-B hologram "
        "floating above it, dusty label scribbled with 'WALLET BACKUP?'",
        "hard-drive"),
    Collectible(4, "epic", "Meme 币图腾", "Meme Coin Totem",
        "a carved stone tribal totem pole topped with a stylized shiba-inu dog head, glowing purple runes, "
        "surrounded by floating meme-coin symbols, smoking incense at the base",
        "meme-coin-totem"),
    Collectible(5, "epic", "劳力士手表", "Rolex Watch",
        "a luxury gold-and-green bezel wristwatch, closeup, the dial face replaced with a tiny "
        "red candlestick chart instead of hour markers, jewel-studded crown",
        "rolex-watch"),
    Collectible(6, "epic", "交易所自定义按钮", "Custom Exchange Button",
        "a glossy purple arcade-style button with engraved label 'CUSTOM', halo of floating UI panels "
        "around it showing 'REFUND', 'DEMO WITHDRAW', 'LEVERAGE x125', holographic translucent menus",
        "custom-exchange-button"),
    Collectible(7, "epic", "FOMO 之眼", "Eye of FOMO",
        "a giant floating mystical eyeball, iris made of a glowing green pump candlestick chart, "
        "purple energy tendrils wrapping around it, third-eye occult aesthetic",
        "eye-of-fomo"),
    Collectible(8, "epic", "牛熊转换罗盘", "Bull-Bear Compass",
        "an ornate brass compass, the needle split in two — one end a golden bull horn, "
        "the other a silver bear claw, engraved candlestick pattern around the rim",
        "bull-bear-compass"),
    Collectible(9, "epic", "空投信标", "Airdrop Beacon",
        "a tall sci-fi beacon tower emitting a vertical purple light beam into the sky, "
        "small token coins raining down around it, floating holographic 'AIRDROP' text",
        "airdrop-beacon"),
    Collectible(10, "epic", "暴跌预言机", "Crash Oracle",
        "a crystal ball on a dark pedestal, inside it a violent red downward candlestick crash chart, "
        "lightning flickering within the glass, purple smoke swirling around the base",
        "crash-oracle"),
]

RARE: list[Collectible] = [
    Collectible(1, "rare", "破损背包扣", "Broken Backpack Clip",
        "a worn plastic backpack buckle clip, one side broken off, faded nylon strap still attached, "
        "scratched surface, abandoned survival gear aesthetic",
        "broken-backpack-clip"),
    Collectible(2, "rare", "神秘二维码", "Mysterious QR Code",
        "a crisp black-and-white QR code printed on slightly wrinkled paper, corner torn, "
        "faint handwritten note 'scan me' beside it",
        "mysterious-qr-code"),
    Collectible(3, "rare", "半张纸条", "Half a Note",
        "a torn half-piece of yellowed paper with six blurry handwritten words visible, "
        "edges burned, hidden-compartment-find aesthetic",
        "half-note"),
    Collectible(4, "rare", "摄像头", "Webcam",
        "a small round webcam with a glowing red recording dot, lens reflecting a trading chart, "
        "short USB cable coiled behind it",
        "webcam"),
    Collectible(5, "rare", "蓝色内裤(战损版)", "Battle-Damaged Blue Underwear",
        "a pair of faded blue boxer briefs, visibly battle-worn with tears, patches, and scorch marks, "
        "pinned to a display like a war relic, comedic yet epic presentation",
        "battle-damaged-underwear"),
    Collectible(6, "rare", "加密 U 盘", "Encrypted USB Drive",
        "a rugged black metal USB drive with a biometric fingerprint scanner, tiny red status LED, "
        "'ENCRYPTED' etched on the side",
        "encrypted-usb"),
    Collectible(7, "rare", "法拉利钥匙", "Ferrari Key",
        "a sleek red Ferrari car key fob with the prancing horse logo, chrome trim, "
        "leather fob tag, no car in sight",
        "ferrari-key"),
    Collectible(8, "rare", "最后 10U", "Last 10 USDT",
        "a crumpled digital receipt showing a USDT wallet balance of '10.00 USDT', "
        "Tether logo, faint tear stains on the paper",
        "last-10-usdt"),
    Collectible(9, "rare", "交易签名笔", "Trading Signature Pen",
        "an elegant black fountain pen with silver trim, nib glowing faintly cyan, "
        "hovering over a translucent holographic 'SIGN TRANSACTION' panel",
        "signature-pen"),
    Collectible(10, "rare", "老鼠仓按钮", "Insider Trading Button",
        "a small ominous red push-button on a brushed metal base, label beneath reads 'INSIDER', "
        "wires trailing out the back, spy-gadget aesthetic",
        "insider-button"),
    Collectible(11, "rare", "梭哈按钮(已损坏)", "Broken All-In Button",
        "a large arcade-style red push-button labeled 'ALL IN', cracked dome, sparks escaping, "
        "dust settled on top, clearly no longer functional",
        "broken-allin-button"),
    Collectible(12, "rare", "套牢证明书", "Bagholder Certificate",
        "an official-looking parchment certificate with ornate borders, bold text "
        "'CERTIFIED BAGHOLDER', wax seal stamp, gold ribbon",
        "bagholder-certificate"),
    Collectible(13, "rare", "泡着枸杞的保温杯", "Wolfberry Thermos",
        "a stainless steel thermos cup with the lid off, steam rising, goji berries (wolfberries) "
        "floating in amber tea inside, condensation droplets on the metal",
        "wolfberry-thermos"),
    Collectible(14, "rare", "加密磁带", "Encrypted Cassette Tape",
        "an old audio cassette tape labeled 'ENCRYPTED', tape partially spooled out, "
        "vintage 80s aesthetic, dust and scratches",
        "encrypted-cassette"),
    Collectible(15, "rare", "钱包备份卡", "Wallet Backup Card",
        "a metal seed-phrase backup card with 12 engraved word slots, most slots filled with "
        "stamped characters, brushed titanium surface",
        "wallet-backup-card"),
    Collectible(16, "rare", "韭菜种子", "Leek Seeds",
        "a small paper seed packet labeled 'LEEK SEEDS' with a cartoon leek illustration, "
        "a few green seeds spilled out beside it",
        "leek-seeds"),
    Collectible(17, "rare", "拉盘号角", "Pumping Horn",
        "an ornate brass ceremonial horn with green candlestick engravings, tassel hanging from it, "
        "faint green energy waves emanating from the opening",
        "pumping-horn"),
    Collectible(18, "rare", "实体比特币", "Physical Bitcoin (Chocolate)",
        "a round gold-wrapped chocolate coin stamped with the Bitcoin B logo, "
        "wrapper partially peeled revealing melted chocolate underneath",
        "physical-bitcoin-chocolate"),
    Collectible(19, "rare", "鼠标", "Fate Mouse",
        "a sleek black gaming mouse with a single glowing cyan scroll wheel, "
        "left-click button illuminated, cable trailing off",
        "fate-mouse"),
    Collectible(20, "rare", "'新鲜'的汉堡", "'Fresh' Hamburger",
        "a suspiciously perfect-looking cheeseburger with sesame bun, unnaturally glossy, "
        "a small tag stuck on a toothpick reading 'EXP: 2001.07', faint chemical green tint",
        "fresh-hamburger"),
]

ALL: list[Collectible] = LEGENDARY + EPIC + RARE


# ----------------------------- 风格模板 -----------------------------

STYLE_BASE = (
    "3D rendered collectible, standing on a dark circular pedestal inside a futuristic "
    "display showcase, deep black background with faint blue cyber circuit grid, "
    "cinematic studio lighting, soft rim light, a small glowing 'WEB3' hanging tag "
    "attached to the top-right corner with a thin string, octane render, 8k, ultra-detailed, "
    "crypto NFT aesthetic, dark luxury, moody atmosphere, centered composition, "
    "product-shot photography, shallow depth of field"
)

TIER_TINT = {
    "legendary": "dominant warm gold and crimson red accent lighting, rich golden particles "
                 "floating in the air, legendary-rarity aura, most prestigious presentation",
    "epic":      "dominant deep purple and violet accent lighting, faint purple energy mist, "
                 "epic-rarity aura",
    "rare":      "dominant silver and cyan accent lighting, subtle blue sparks, rare-rarity aura",
}


def build_prompt(c: Collectible) -> str:
    return (
        f"{c.subject}. "
        f"{STYLE_BASE}. "
        f"{TIER_TINT[c.tier]}. "
        f"No text overlays except what is naturally part of the object. "
        f"Square 1:1 composition."
    )


# ----------------------------- 主逻辑 -----------------------------

def ensure_dir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)


def save_manifest(out_root: Path) -> None:
    """写一份 manifest.json 方便前端引用。"""
    data = [
        {
            "tier": c.tier,
            "index": c.index,
            "name_cn": c.name_cn,
            "name_en": c.name_en,
            "slug": c.slug,
            "file": f"{c.tier}/{c.index:02d}_{c.slug}.png",
        }
        for c in ALL
    ]
    (out_root / "manifest.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def generate_one(
    client: OpenAI,
    c: Collectible,
    out_root: Path,
    *,
    model: str,
    size: str,
    quality: str,
    overwrite: bool,
    dry_run: bool,
) -> tuple[Collectible, str]:
    tier_dir = out_root / c.tier
    ensure_dir(tier_dir)
    out_path = tier_dir / f"{c.index:02d}_{c.slug}.png"

    if out_path.exists() and not overwrite:
        return c, f"skip (exists) -> {out_path}"

    prompt = build_prompt(c)
    if dry_run:
        return c, f"[DRY] {out_path}\n  prompt: {prompt[:140]}..."

    last_err: Exception | None = None
    for attempt in range(1, 4):
        try:
            resp = client.images.generate(
                model=model,
                prompt=prompt,
                size=size,
                quality=quality,
                n=1,
            )
            b64 = resp.data[0].b64_json
            if b64 is None:
                # 某些后端回落到 url (例如 yunwu 中转返回 OSS 直链)
                url = getattr(resp.data[0], "url", None)
                if not url:
                    raise RuntimeError("response contained neither b64_json nor url")
                import urllib.request
                # 部分 OSS 会拒绝默认 Python-urllib UA,需显式设置
                req = urllib.request.Request(
                    url, headers={"User-Agent": "Mozilla/5.0 (collectibles-fetch)"}
                )
                with urllib.request.urlopen(req, timeout=120) as r:
                    out_path.write_bytes(r.read())
            else:
                out_path.write_bytes(base64.b64decode(b64))
            return c, f"ok -> {out_path}"
        except Exception as e:  # noqa: BLE001
            last_err = e
            wait = 2 ** attempt
            print(f"  [retry {attempt}/3] {c.name_cn}: {e}  (sleep {wait}s)", file=sys.stderr)
            time.sleep(wait)
    return c, f"FAIL {c.name_cn}: {last_err}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default=os.getenv("IMAGE_MODEL", "gpt-image-2-all"),
                    help="图像模型名 (默认 gpt-image-2-all)")
    ap.add_argument("--size", default="1024x1024",
                    choices=["1024x1024", "1024x1536", "1536x1024", "auto"])
    ap.add_argument("--quality", default="high", choices=["low", "medium", "high", "auto"])
    ap.add_argument("--concurrency", type=int, default=3)
    ap.add_argument("--tier", choices=["legendary", "epic", "rare"], default=None)
    ap.add_argument("--only", default=None, help="按中文名模糊匹配,只生成一个")
    ap.add_argument("--output", default="assets/collectibles")
    ap.add_argument("--overwrite", action="store_true", help="强制重新生成已存在的图")
    ap.add_argument("--dry-run", action="store_true", help="只打印 prompt,不调用 API")
    args = ap.parse_args()

    # 过滤
    targets = ALL
    if args.tier:
        targets = [c for c in targets if c.tier == args.tier]
    if args.only:
        targets = [c for c in targets if args.only in c.name_cn or args.only in c.name_en]
    if not targets:
        print("没有匹配到任何藏品。", file=sys.stderr)
        return 2

    out_root = Path(args.output)
    ensure_dir(out_root)
    save_manifest(out_root)

    if args.dry_run:
        client = None  # type: ignore[assignment]
    else:
        if not os.getenv("OPENAI_API_KEY"):
            print("请先设置 OPENAI_API_KEY 环境变量。", file=sys.stderr)
            return 1
        client = OpenAI(
            api_key=os.environ["OPENAI_API_KEY"],
            base_url=os.getenv("OPENAI_BASE_URL"),
        )

    print(f"开始生成 {len(targets)} 张图片 -> {out_root}/  "
          f"(model={args.model}, size={args.size}, quality={args.quality}, "
          f"concurrency={args.concurrency})")
    t0 = time.time()

    ok = fail = skip = 0
    with futures.ThreadPoolExecutor(max_workers=args.concurrency) as pool:
        jobs = [
            pool.submit(
                generate_one, client, c, out_root,
                model=args.model, size=args.size, quality=args.quality,
                overwrite=args.overwrite, dry_run=args.dry_run,
            )
            for c in targets
        ]
        for fut in futures.as_completed(jobs):
            c, msg = fut.result()
            print(f"  [{c.tier:9}] {c.name_cn:<14} {msg}")
            if msg.startswith("ok"):
                ok += 1
            elif msg.startswith("skip"):
                skip += 1
            elif msg.startswith("FAIL"):
                fail += 1

    dt = time.time() - t0
    print(f"\n完成: ok={ok} skip={skip} fail={fail}  耗时 {dt:.1f}s")
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
