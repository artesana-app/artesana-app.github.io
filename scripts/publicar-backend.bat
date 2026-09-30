@echo off
chcp 65001 >nul
title artesana. - publicar backend
echo ============================================================
echo  artesana. - publicar o backend na Cloudflare
echo ============================================================
echo.
echo  1) Se pedir, vai abrir o navegador com a tela do Cloudflare.
echo     Clique em ALLOW (Permitir). Sem conta? Crie ali mesmo e depois clique em Allow.
echo  2) Depois disso tudo roda sozinho: banco, backend, painel, app.
echo.
cd /d C:\Users\ramom\Downloads\bibi\backend
call npx wrangler whoami 2>&1 | findstr /C:"not authenticated" >nul
if %errorlevel%==0 (
  echo Abrindo o navegador para autorizar...
  call npx wrangler login
)
cd /d C:\Users\ramom\Downloads\bibi
python scripts\publicar-backend.py
echo.
if errorlevel 1 (
  echo ============================================================
  echo  DEU ERRO. Tire um print desta janela e me mande.
  echo ============================================================
) else (
  echo ============================================================
  echo  PRONTO! Painel, usuario e senha estao logo acima.
  echo  Guarde a senha: ela tambem fica em backend\.segredos.json
  echo ============================================================
)
pause
