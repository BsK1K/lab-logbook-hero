# App Desktop (Windows / Linux / macOS)

O scaffold do Electron já está pronto em `electron/main.cjs`. Ele abre uma janela nativa carregando o app publicado da Lovable.

## Gerar o .exe (Windows)

No seu PC, dentro da pasta do projeto:

```bash
# 1. Instale o Electron e o packager (uma vez só)
npm install --save-dev electron @electron/packager

# 2. Gere o instalador portável .exe
npx @electron/packager . "Sala-Informatica" \
  --platform=win32 --arch=x64 \
  --out=electron-release --overwrite \
  --icon=public/icon-512.png \
  --ignore="^/src" --ignore="^/supabase" --ignore="^/electron-release"
```

Para Windowns:

npx @electron/packager . "Sala-Informatica" --platform=win32 --arch=x64 --out=electron-release --overwrite --icon=public/icon-512.png --ignore="^/src" --ignore="^/supabase" --ignore="^/electron-release"

O resultado fica em `electron-release/Sala-Informatica-win32-x64/`. Basta zipar a pasta e distribuir — o usuário roda `Sala-Informatica.exe` direto, sem instalação.

## Linux / macOS

Troque `--platform=win32` por `--platform=linux` ou `--platform=darwin`.

## Apontar para preview em vez de produção

Defina `APP_URL` antes de abrir:

```bash
APP_URL=https://project--fdefe534-3ab4-4c8c-97c0-483caea668e1-dev.lovable.app npx electron .
```

## Mobile (Android / iOS)

O app já é um **PWA instalável** — basta abrir o site no celular e:

- **Android (Chrome)**: menu → "Adicionar à tela inicial" / "Instalar app"
- **iOS (Safari)**: botão compartilhar → "Adicionar à Tela de Início"

Vira um ícone na home igual a um app nativo, abre em tela cheia, sem barra do navegador. Sem necessidade de loja.
