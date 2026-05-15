# bkit 5-Minute Quickstart

**Prereq**: [Gemini CLI](https://github.com/google-gemini/gemini-cli) ≥ v0.34.0 installed.

## Install
```bash
gemini extensions install https://github.com/popup-studio-ai/bkit-gemini
gemini -p "bkit Hi"
```
Expected: `bkit Vibecoding Kit v2.0.7 activated (Gemini CLI) - Level: Starter`.

## First PDCA
```
/pdca plan login
/pdca design login
/pdca implement login
```
Each step writes/updates `docs/{01-plan,02-design,03-analysis}/features/login.*.md`.

## Three Use Cases
- **New static site** → `/starter` (HTML/CSS scaffolding)
- **Fullstack app** → `/dynamic` (bkend.ai + UI)
- **Microservices** → `/enterprise` (AWS/K8s)

## Next
- Full docs → [README](README.md) + [docs/reference/](docs/reference/)
- Pipeline → `/development-pipeline`
- Help → `/bkit` or `/help`
