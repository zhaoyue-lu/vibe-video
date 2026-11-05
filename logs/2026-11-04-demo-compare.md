# 5 秒对比：A（Canvas 逐帧） vs B（Remotion）

2026-11-04 · 两条路都跑通了，产出在 `render/demo-a.mp4` / `render/demo-b.mp4`
规格统一：1080×1920 / 30fps / 150 帧 / 5.00s / H.264

## 一句话结论

- **A**：画面自由度高，能做出「不是模板」的东西；代码量大，调试靠眼睛。
- **B**：排版和节奏几乎白送，出片稳；画面偏「设计稿」，野不起来。
- **真正的杀器是叠着用**：A 的画面当底，B 在上面排字。

## 实测数据

| | A · Canvas 逐帧 | B · Remotion |
| --- | --- | --- |
| 依赖安装 | puppeteer-core + ffmpeg-static（78MB 二进制） | 249 个包 + 需要 Chrome |
| 代码量 | ~150 行 JS | ~130 行 TSX |
| 渲染耗时 | 197s（截图 166s + 编码 31s） | ~2min（150 帧序列） |
| 成片大小 | 8.4 MB（7.8 Mbps） | 643 KB（1.0 Mbps） |
| 画面 | 流光漩涡，青→紫→粉渐变 | 大字排版 + 辉光 + 橙色锚点 |
| 改一版要多久 | 改参数 → 重渲 3 分钟 | 改参数 → 重渲 2 分钟 |
| 适合 | 氛围、抽象、音频可视化、无限循环 | 口播字卡、信息叙事、片头片尾 |

B 的码率低是因为画面几乎静止（大面积纯色 + 慢动画），不是画质差。

## 踩到的坑（都绕过去了）

1. **npm 缓存被 root 文件污染** → `npm_config_cache=./.npmcache` 项目内单独缓存，不用 sudo。
2. **机器没有 ffmpeg、没有 brew** → `ffmpeg-static` 提供 78MB 静态二进制，能直接用。
3. **python3 坏了**（xcrun 指向不存在的 CommandLineTools）→ Manim 那条路彻底放弃。
4. **Remotion 自带的 ffmpeg 要 macOS 15+**，这台是 13.7.8 → `dyld: Symbol not found` 崩。
   绕法：`--sequence` 只出 PNG 帧序列，再用 A 那份 ffmpeg 编码。
5. **Remotion 的 chrome-headless-shell 下载极慢**（35 KB/s）→
   `--browser-executable="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"` 直接用系统 Chrome。
6. **图形 bug 两个，都是"看着不对但代码不报错"**：
   - curl noise 的 `EPS` 用了噪声空间步长却按像素理解 → 退化成随机场，粒子糊成一坨；
   - 粒子 wrap 时继续 `lineTo` → 拉出横贯整屏的直线条纹。改成越界就重生、不画。

## 下次直接复用的命令

```bash
# A
cd demo-a && node render.mjs

# B（帧序列 + 手动编码）
cd demo-b && npx remotion render src/index.ts Vibe --sequence --output=../render/demo-b-frames \
  --browser-executable="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
../demo-a/node_modules/ffmpeg-static/ffmpeg -framerate 30 -i ../render/demo-b-frames/element-%03d.png \
  -c:v libx264 -crf 18 -pix_fmt yuv420p ../render/demo-b.mp4
```

代理（系统代理 curl/npm 不会自动读，必须显式注入）：

```bash
export HTTPS_PROXY=http://127.0.0.1:7897 HTTP_PROXY=http://127.0.0.1:7897
```
