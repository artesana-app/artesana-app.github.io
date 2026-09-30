"""Publica o backend na Cloudflare do começo ao fim, depois de `npx wrangler login`.

O que faz, nesta ordem (pula o que já está feito):
  1. confere o login;
  2. cria o banco D1 "artesana" (ou acha o existente) e grava o id em backend/wrangler.toml;
  3. aplica backend/schema.sql no banco remoto;
  4. cria usuário e senha do painel se ainda não existirem (guardados em backend/.segredos.json, fora do git)
     e sobe todos os segredos desse arquivo pro Worker;
  5. faz o deploy e descobre o endereço do Worker;
  6. grava o endereço em app/js/site.js (SITE.backend), sobe o CACHE do app/sw.js, roda os testes,
     commita, faz push e publica o espelho;
  7. testa o Worker publicado (evento de teste + painel) e apaga o registro de teste.

Uso: python scripts/publicar-backend.py [--sem-publicar-app]
"""
import argparse
import json
import re
import secrets
import string
import subprocess
import sys
import urllib.request
import base64
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BACKEND = RAIZ / "backend"
SEGREDOS = BACKEND / ".segredos.json"
TOML = BACKEND / "wrangler.toml"
SITE_JS = RAIZ / "app" / "js" / "site.js"
SW = RAIZ / "app" / "sw.js"


def sh(*args, cwd=BACKEND, entrada=None, ok_falhar=False):
    print("$", " ".join(args))
    r = subprocess.run(list(args), cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace", input=entrada, shell=(args[0] in ("npx", "git")))
    if r.returncode != 0 and not ok_falhar:
        sys.exit(f"falhou ({r.returncode}):\n{r.stdout}\n{r.stderr}")
    return r.stdout + r.stderr


def passo_login():
    saida = sh("npx", "wrangler", "whoami", ok_falhar=True)
    if "not authenticated" in saida.lower():
        sys.exit("Não está logado na Cloudflare. Rode `npx wrangler login` na pasta backend e autorize no navegador.")
    m = re.search(r"associated with the email (\S+)", saida)
    print("logado como", m.group(1) if m else "(conta encontrada)")


def passo_banco():
    toml = TOML.read_text(encoding="utf-8")
    atual = re.search(r'database_id\s*=\s*"([^"]*)"', toml).group(1)
    if atual and atual != "local" and len(atual) > 20:
        print("banco já configurado:", atual)
        return
    lista = sh("npx", "wrangler", "d1", "list", "--json", ok_falhar=True)
    db_id = None
    try:
        for d in json.loads(lista[lista.index("["):]):
            if d.get("name") == "artesana":
                db_id = d.get("uuid") or d.get("id")
    except (ValueError, IndexError):
        pass
    if not db_id:
        saida = sh("npx", "wrangler", "d1", "create", "artesana")
        m = re.search(r'database_id\s*=\s*"([0-9a-f-]{20,})"', saida) or re.search(r"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})", saida)
        if not m:
            sys.exit(f"não achei o id do banco na saída:\n{saida}")
        db_id = m.group(1)
    toml = re.sub(r'database_id\s*=\s*"[^"]*"', f'database_id = "{db_id}"', toml)
    TOML.write_text(toml, encoding="utf-8", newline="\n")
    print("banco:", db_id)


def passo_schema():
    sh("npx", "wrangler", "d1", "execute", "artesana", "--remote", "--file=schema.sql", "-y")


def passo_segredos():
    dados = json.loads(SEGREDOS.read_text(encoding="utf-8")) if SEGREDOS.exists() else {}
    if not dados.get("ADMIN_USER") or not dados.get("ADMIN_SENHA"):
        letras = string.ascii_letters + string.digits
        dados["ADMIN_USER"] = dados.get("ADMIN_USER") or "artesana"
        dados["ADMIN_SENHA"] = dados.get("ADMIN_SENHA") or "".join(secrets.choice(letras) for _ in range(16))
    if not dados.get("TELEGRAM_SECRET"):
        dados["TELEGRAM_SECRET"] = secrets.token_urlsafe(24).replace("-", "x")
    SEGREDOS.write_text(json.dumps(dados, indent=2, ensure_ascii=False), encoding="utf-8", newline="\n")
    enviar = {k: str(v) for k, v in dados.items() if v}
    tmp = BACKEND / ".segredos-envio.json"
    tmp.write_text(json.dumps(enviar), encoding="utf-8")
    try:
        sh("npx", "wrangler", "secret", "bulk", str(tmp))
    finally:
        tmp.unlink(missing_ok=True)
    print("segredos enviados:", ", ".join(sorted(enviar)))
    return dados


def passo_deploy():
    saida = sh("npx", "wrangler", "deploy")
    m = re.search(r"https://[a-z0-9.-]+\.workers\.dev", saida)
    if not m:
        sys.exit(f"deploy sem endereço na saída:\n{saida}")
    print("worker:", m.group(0))
    return m.group(0)


def passo_app(url):
    js = SITE_JS.read_text(encoding="utf-8")
    novo = re.sub(r"backend:\s*(null|'[^']*')", f"backend: '{url}'", js, count=1)
    if novo == js and f"'{url}'" not in js:
        sys.exit("não achei `backend:` em app/js/site.js")
    SITE_JS.write_text(novo, encoding="utf-8", newline="\n")
    sw = SW.read_text(encoding="utf-8")
    m = re.search(r"const CACHE = 'artesana-v(\d+)\.(\d+)\.(\d+)';", sw)
    ver = f"{m.group(1)}.{m.group(2)}.{int(m.group(3)) + 1}"
    SW.write_text(sw.replace(m.group(0), f"const CACHE = 'artesana-v{ver}';"), encoding="utf-8", newline="\n")
    print("app: SITE.backend =", url, "| sw cache", ver)
    testes = sh("node", "--test", cwd=RAIZ, ok_falhar=True)
    if "# fail 0" not in testes and "fail 0" not in testes:
        sys.exit(f"testes falharam:\n{testes[-2000:]}")
    sh("git", "add", "-A", cwd=RAIZ)
    sh("git", "commit", "-q", "-m", f"feat(app): liga o app ao backend {url}\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>", cwd=RAIZ)
    sh("git", "push", "-q", "origin", "main", cwd=RAIZ)
    print(sh(sys.executable, "scripts/espelho.py", cwd=RAIZ).strip())


def passo_teste(url, segredos):
    def pedir(caminho, dados=None, auth=None):
        r = urllib.request.Request(url + caminho, data=json.dumps(dados).encode() if dados is not None else None, headers={"Content-Type": "application/json", "Origin": "https://artesana-mktdigital.com.br"})
        if auth:
            r.add_header("Authorization", auth)
        with urllib.request.urlopen(r, timeout=30) as resp:
            return json.loads(resp.read() or b"{}")
    v = "eeee0000" + secrets.token_hex(4)
    assert pedir("/")["ok"]
    assert pedir("/v1/eventos", {"visitante": v, "aparelho": "computador", "eventos": [{"tipo": "pagina", "rota": "teste"}]})["recebidos"] == 1
    auth = "Basic " + base64.b64encode(f"{segredos['ADMIN_USER']}:{segredos['ADMIN_SENHA']}".encode()).decode()
    resumo = pedir("/admin/resumo", auth=auth)
    assert resumo["ok"] and resumo["totais"]["visitantes"] >= 1
    sh("npx", "wrangler", "d1", "execute", "artesana", "--remote", "-y", f"--command=DELETE FROM eventos WHERE visitante = '{v}'; DELETE FROM visitantes WHERE id = '{v}';")
    print("worker publicado responde; painel autentica; registro de teste apagado")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sem-publicar-app", action="store_true", help="não mexe em site.js/sw.js nem faz push")
    args = ap.parse_args()
    passo_login()
    passo_banco()
    passo_schema()
    segredos = passo_segredos()
    url = passo_deploy()
    passo_teste(url, segredos)
    if not args.sem_publicar_app:
        passo_app(url)
    print("\nPRONTO")
    print("painel:  https://artesana-mktdigital.com.br/app/admin/")
    print("usuário:", segredos["ADMIN_USER"])
    print("senha:  ", segredos["ADMIN_SENHA"])
    print("worker: ", url)
    if segredos.get("TELEGRAM_TOKEN"):
        print("webhook do Telegram:", f"https://api.telegram.org/bot<TOKEN>/setWebhook?url={url}/telegram/{segredos['TELEGRAM_SECRET']}")


if __name__ == "__main__":
    main()
