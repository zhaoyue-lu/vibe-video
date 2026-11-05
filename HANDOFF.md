# 交接：这个工作区是怎么来的

2026-11-04 建，用来做 **vibe 视频 = 纯代码生成的视频**（不是 AI 出图/出片）。
`ideas/` `scripts/` `prompts/` 还是空的，但**工具链已经跑通并验证过**，见下。

> 早期版本把方向记成了「可灵/即梦/ComfyUI」，那是错的，已作废。

## 现状：两条链路都能出片

产出在 `render/demo-a.mp4`、`render/demo-b.mp4`（1080×1920 / 30fps / 5s）。
详细对比、耗时、坑：`logs/2026-11-04-demo-compare.md`

| | A · Canvas 逐帧 | B · Remotion |
| --- | --- | --- |
| 目录 | `demo-a/` | `demo-b/` |
| 跑 | `node render.mjs` | 见 compare 文档（帧序列 + 手动编码） |
| 强项 | 氛围/抽象/循环，画面自由 | 排版/字卡/节奏，出片稳 |

## 环境事实（都在这个工作区里解决，不动系统）

- **npm 缓存被 root 污染**：装包必须 `npm_config_cache=../.npmcache npm i ...`，别用 sudo。
- **没有 ffmpeg / 没有 brew**：`demo-a/node_modules/ffmpeg-static/ffmpeg` 就是那个二进制，78MB，可复用。
- **python3 坏了**（xcrun 指向不存在的 CommandLineTools）：Manim 那条路别想。
- **macOS 13.7.8**：Remotion 自带 ffmpeg 要 15+，会 `dyld` 崩 → 必须走 `--sequence` + 手动编码。
- **系统代理 `127.0.0.1:7897`**：curl / npm / Chrome 都不会自动读，要显式 `export HTTPS_PROXY=...`。下 Remotion 的 headless shell 只有 35 KB/s，直接用 `--browser-executable` 指系统 Chrome。

## 下一步（等拍板）

1. 先深挖哪条？A 做「氛围片」，还是 B 做「字卡片」？
2. 要不要把两条**合成一条流水线**：A 出画面 → 当 B 的背景层 → B 排字？
3. 第一期做什么主题？（`ideas/` 还是空的）
