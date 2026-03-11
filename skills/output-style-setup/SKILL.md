---
name: output-style-setup
classification: W
description: |
  Install bkit output styles to your project or user directory.
  Copies output style files from bkit plugin to the appropriate location.

  Triggers: output style setup, install output style, setup style,
  아웃풋 스타일 설치, 스타일 설정,
  出力スタイル設定, スタイルインストール,
  输出样式安装, 样式设置,
  instalar estilo, configurar estilo,
  installer le style, configurer le style,
  Stil installieren, Stil einrichten,
  installare stile, configurare stile

user-invocable: true
allowed-tools:
  - read_file
  - write_file
  - glob
classification: capability
---

# Output Style Setup Skill

> Install and configure bkit output styles for your project. Output styles control the formatting and structure of all bkit-generated responses.

## Usage

```
/output-style-setup
/output-style-setup list
/output-style-setup install <style-name>
/output-style-setup verify
```

## Available Styles

| Style | Description | Best For |
|-------|-------------|----------|
| `standard` | Default bkit formatting with tables and sections | General development |
| `compact` | Minimal output, reduced whitespace | CI/CD pipelines |
| `detailed` | Verbose output with full context | Documentation work |
| `executive` | Summary-first with key metrics highlighted | PM and stakeholder reviews |

## Installation Steps

1. **List available styles**: Shows all styles bundled with bkit
2. **Select a style**: Choose the style that fits your workflow
3. **Install**: Copies style configuration to `.gemini/context/output-style.md`
4. **Verify**: Confirms the style is active and correctly loaded

## Installation Targets

- **Project-level** (default): `.gemini/context/output-style.md`
- **User-level**: `~/.gemini/context/output-style.md`

Project-level styles override user-level styles.

## Verification

After installation, run `/output-style-setup verify` to confirm:
- Style file exists at the expected path
- Style file is valid and parseable
- Style is being loaded by Gemini context system
- Sample output matches expected formatting

## Custom Styles

You can create custom styles by placing a markdown file in `.gemini/context/output-style.md` with the following structure:

```markdown
## Output Style: <your-style-name>

### Response Structure
(Define section ordering and required sections)

### Formatting Rules
(Define table formats, code block usage, heading levels)

### Tone and Language
(Define formality level, technical depth)
```

## Reset

To reset to the default style:

```
/output-style-setup install standard
```
