#!/bin/zsh
# Duplo clique: abre o Terminal já dentro da pasta do site.
# Depois digite:  npm install   (só na primeira vez)
#                npm run dev    (para ver o site)
#                npm run build  (para gerar a pasta dist)
cd "$(dirname "$0")"
exec /bin/zsh -l
