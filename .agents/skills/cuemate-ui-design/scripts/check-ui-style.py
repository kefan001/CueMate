#!/usr/bin/env python3
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[4]
MINIAPP = ROOT / "miniapp"
ICONS_JS = MINIAPP / "components" / "ui-icon" / "icons.js"

# Skeuomorphic / 3D system emojis forbidden in UI templates
FORBIDDEN_EMOJIS = [
    "📍", "🔍", "💬", "📅", "🖼️", "🎙️", "🔊", "🔈",
    "🕒", "🏆", "💳", "🎟", "🛡", "📱", "❓", "⚙",
]

def main():
    errors = []

    # 1. Check registered icons in miniapp/components/ui-icon/icons.js
    if not ICONS_JS.exists():
        errors.append(f"Missing {ICONS_JS}")
        registered_icons = set()
    else:
        text = ICONS_JS.read_text("utf-8")
        registered_icons = set(re.findall(r"['\"]([a-z0-9-]+)['\"]\s*:\s*`<svg", text))

    # 2. Scan all WXML and TSX files for forbidden skeuomorphic emojis
    target_files = list(MINIAPP.rglob("*.wxml")) + list((ROOT / "web" / "src").rglob("*.tsx"))
    for f in target_files:
        content = f.read_text("utf-8")
        for emoji in FORBIDDEN_EMOJIS:
            if emoji in content:
                errors.append(f"Forbidden skeuomorphic emoji '{emoji}' found in {f.relative_to(ROOT)}")

        if f.suffix == ".wxml" and "<ui-icon" in content:
            # Verify index.json registers ui-icon
            json_file = f.with_suffix(".json")
            if not json_file.exists():
                errors.append(f"Missing {json_file.relative_to(ROOT)} for {f.relative_to(ROOT)}")
            else:
                try:
                    cfg = json.loads(json_file.read_text("utf-8"))
                    using = cfg.get("usingComponents", {})
                    if using.get("ui-icon") != "/components/ui-icon/index":
                        errors.append(
                            f"Missing '\"ui-icon\": \"/components/ui-icon/index\"' in {json_file.relative_to(ROOT)}"
                        )
                except Exception as exc:
                    errors.append(f"Invalid JSON in {json_file.relative_to(ROOT)}: {exc}")

            # Verify all <ui-icon name="..." /> usages
            for m in re.finditer(r"<ui-icon[^>]*\bname=\"([^\"]+)\"", content):
                name_expr = m.group(1)
                if "{{" in name_expr:
                    # Extract string literals inside ternary expressions
                    literals = re.findall(r"'([a-z0-9-]+)'", name_expr)
                    for lit in literals:
                        if lit not in registered_icons:
                            errors.append(f"Unregistered ui-icon '{lit}' in {f.relative_to(ROOT)}")
                else:
                    if name_expr not in registered_icons:
                        errors.append(f"Unregistered ui-icon '{name_expr}' in {f.relative_to(ROOT)}")

    if errors:
        print("UI STYLE AUDIT FAILED:")
        for err in errors:
            print("  -", err)
        sys.exit(1)

    print(
        f"UI STYLE AUDIT PASSED! Checked {len(target_files)} template files | "
        f"Registered flat vector icons: {len(registered_icons)}"
    )

if __name__ == "__main__":
    main()
