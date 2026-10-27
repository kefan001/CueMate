---
name: cuemate-ui-design
description: >-
  Enforces CueMate's Dark Athletic Minimalist UI design system and flat iconography
  across Web (web/), WeChat Mini Program (miniapp/), and React Native App (app/).
  Use this skill whenever creating, modifying, or reviewing UI pages, components,
  icons, or styles in CueMate.
---

# CueMate UI Design & Flat Iconography Skill

This skill defines the visual language, color tokens, layout geometry, and flat vector iconography standards for the CueMate monorepo (`web/`, `miniapp/`, `app/`).

## 1. Core Aesthetic Principles

- **Visual Direction**: Dark Athletic Minimalist (暗黑极简台球俱乐部质感).
- **Strictly Flat Vector Icons**:
  - **NEVER** use system彩色/拟物 Emoji characters (such as `📍`, `🔍`, `💬`, `📅`, `🖼️`, `🎙️`, `🔊`, `🔈`, `🕒`, `🏆`, `💳`, `🎟`, `🛡`, `📱`, `❓`, `⚙`) as UI icons. Apple/iOS renders emojis in a 3D skeuomorphic style that clashes with the flat dark interface.
  - **Web (`web/`)**: Use `lucide-react` 2px stroke vector icons.
  - **WeChat Mini Program (`miniapp/`)**: Use the `<ui-icon name="..." size="..." color="..." />` component (`miniapp/components/ui-icon/index`), which renders flat 24x24 Lucide SVG paths via CSS mask.
  - **Native App (`app/`)**: Use `@expo/vector-icons` (Feather / Ionicons outline) or `lucide-react-native`.

## 2. Color Tokens

| Token Semantic | Hex / Value | Usage |
| :--- | :--- | :--- |
| **Background Primary** | `#09090b` (Zinc-950) | Page background, bottom bar, modal sheet surface |
| **Surface Card** | `rgba(24, 24, 27, 0.65)` | Primary content cards |
| **Surface Elevated** | `#18181b` (Zinc-900) | Inputs, secondary buttons, icon buttons, filter pills |
| **Border Subtle** | `#27272a` / `rgba(39, 39, 42, 0.75)` | Card outlines, dividers, input borders (`1px` / `2rpx`) |
| **Primary Brand (Billiards)** | `#10b981` / `#059669` | Primary CTAs, active tabs, online/verified badges |
| **Primary Soft Tint** | `rgba(16, 185, 129, 0.14)` | Active pill backgrounds, highlighted icon containers |
| **Accent Gold** | `#facc15` | Star ratings, companion level titles, premium badges |
| **Text Primary** | `#ffffff` / `#fafafa` | Headings, prices, primary labels |
| **Text Secondary** | `#a1a1aa` (Zinc-400) | Descriptions, timestamps, secondary metadata |
| **Text Muted** | `#71717a` (Zinc-500) | Placeholders, disabled labels, subtle hints |
| **Danger / Rose** | `#f87171` / `#f43f5e` | Unread badges, cancellations, no-show alerts |

## 3. WeChat Mini Program `<ui-icon>` Usage (`miniapp/`)

1. Declare `ui-icon` in the page or component `.json`:
   ```json
   {
     "usingComponents": {
       "ui-icon": "/components/ui-icon/index"
     }
   }
   ```
2. Render flat vector icons in `.wxml`:
   ```xml
   <ui-icon name="map-pin" size="28" color="#34d399" />
   <ui-icon name="star-fill" size="24" color="#facc15" />
   ```
3. If a new icon is needed, add its 24x24 Lucide SVG markup to [icons.js](../../../miniapp/components/ui-icon/icons.js).

## 4. Verification Step

After making any UI changes in `web/`, `miniapp/`, or `app/`, run the automated style & icon audit script:

```bash
/Users/zhongjindou/miniconda3/bin/python3 .agents/skills/cuemate-ui-design/scripts/check-ui-style.py
```

Fix any reported skeuomorphic emojis or unregistered `<ui-icon>` names before finishing the task.
