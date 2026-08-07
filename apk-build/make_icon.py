"""
生成程序员计算器 app 图标 - 苹果极简风 v2
设计理念:少即是多
  - 纯深色背景(#1C1C1E iOS 黑)
  - 中央一个橙色圆角方块(#FF9F0A,与应用运算键同色)
  - 方块内用两条白色横线组成 = 符号(不依赖字体,线条更精致)
  - 去掉显示屏和小亮点,让视觉焦点集中在 = 上
配色与应用 UI 完全一致
"""
from PIL import Image, ImageDraw
import os

# 颜色(与应用 UI 一致)
BG = (28, 28, 30, 255)        # #1C1C1E iOS 黑
ORANGE = (255, 159, 10, 255)  # #FF9F0A 橙色运算键
WHITE = (255, 255, 255, 255)


def draw_equals(draw, cx, cy, w, h, line_thick, gap, color):
    """用两条横线画 = 符号,不依赖字体
    cx, cy: 中心点
    w: 横线宽度
    line_thick: 横线粗细
    gap: 两条线之间的间距
    """
    half_w = w // 2
    half_h = h // 2
    # 上线
    top_y = cy - gap // 2 - line_thick
    draw.rounded_rectangle(
        (cx - half_w, top_y, cx + half_w, top_y + line_thick),
        radius=line_thick // 2,
        fill=color,
    )
    # 下线
    bot_y = cy + gap // 2
    draw.rounded_rectangle(
        (cx - half_w, bot_y, cx + half_w, bot_y + line_thick),
        radius=line_thick // 2,
        fill=color,
    )


def make_icon(size: int) -> Image.Image:
    """生成指定尺寸的图标"""
    # 高分辨率画布,最后缩放避免锯齿
    scale = max(4, 1024 // size)
    s = size * scale
    img = Image.new("RGBA", (s, s), BG)
    d = ImageDraw.Draw(img)

    # 中央橙色圆角方块 - 占图标约 60%,居中
    box_size = int(s * 0.60)
    box_x1 = (s - box_size) // 2
    box_y1 = (s - box_size) // 2
    box_x2 = box_x1 + box_size
    box_y2 = box_y1 + box_size
    # 圆角半径约为方块的 22%(苹果风圆角)
    radius = int(box_size * 0.22)
    d.rounded_rectangle((box_x1, box_y1, box_x2, box_y2), radius=radius, fill=ORANGE)

    # 在橙色方块中央用两条白色横线画 = 符号
    cx = s // 2
    cy = s // 2
    # 横线宽度 = 方块的 45%
    eq_w = int(box_size * 0.45)
    # 横线粗细 = 方块的 11%
    line_thick = int(box_size * 0.11)
    # 两条线间距 = 方块的 16%
    gap = int(box_size * 0.16)
    # 整体高度 = line_thick*2 + gap
    eq_h = line_thick * 2 + gap
    draw_equals(d, cx, cy, eq_w, eq_h, line_thick, gap, WHITE)

    # 缩放到目标尺寸
    return img.resize((size, size), Image.LANCZOS)


def main():
    out_dir = "/workspace/apk-build/res"
    # 标准 mipmap 尺寸
    sizes = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    for d, sz in sizes.items():
        p = os.path.join(out_dir, d)
        os.makedirs(p, exist_ok=True)
        img = make_icon(sz)
        img.save(os.path.join(p, "ic_launcher.png"))
        img.save(os.path.join(p, "ic_launcher_round.png"))
        print(f"  {d}/ic_launcher.png  ({sz}x{sz})")

    # 512x512 高清版本
    big = make_icon(512)
    big.save(os.path.join(out_dir, "ic_launcher_512.png"))
    print(f"  ic_launcher_512.png (512x512)")

    # adaptive icon 前景与背景(Android 8+)
    # 背景:纯深色
    bg_full = Image.new("RGBA", (512, 512), BG)
    bg_full.save(os.path.join(out_dir, "drawable", "ic_launcher_background.png"))
    os.makedirs(os.path.join(out_dir, "drawable"), exist_ok=True)
    bg_full.save(os.path.join(out_dir, "drawable", "ic_launcher_background.png"))

    # 前景:居中橙色方块 + = 符号,周围透明
    # adaptive icon 安全区是中心 432x432(108dp),需要把内容画在安全区内
    fg = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    fd = ImageDraw.Draw(fg)
    # 方块大小占安全区的 80%,确保不被遮罩裁切
    box_size = int(432 * 0.80)
    box_x1 = (512 - box_size) // 2
    box_y1 = (512 - box_size) // 2
    box_x2 = box_x1 + box_size
    box_y2 = box_y1 + box_size
    radius = int(box_size * 0.22)
    fd.rounded_rectangle((box_x1, box_y1, box_x2, box_y2), radius=radius, fill=ORANGE)

    cx = 256
    cy = 256
    eq_w = int(box_size * 0.45)
    line_thick = int(box_size * 0.11)
    gap = int(box_size * 0.16)
    draw_equals(fd, cx, cy, eq_w, line_thick * 2 + gap, line_thick, gap, WHITE)
    fg.save(os.path.join(out_dir, "drawable", "ic_launcher_foreground.png"))
    print(f"  drawable/ic_launcher_foreground.png (adaptive icon fg)")


if __name__ == "__main__":
    main()
    print("图标生成完成")
