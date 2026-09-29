"""Publica o site num endereço novo e gratuito do GitHub, com o nome da marca: https://<nome>.github.io

No GitHub o endereço é sempre <dono>.github.io, então o nome novo precisa existir como organização gratuita.
Criar a organização e o repositório é um passo manual de quem é dona dela. Este script aceita o convite,
envia o site, liga o GitHub Pages e testa.

Uso:
  python scripts/mudar-endereco.py --verificar              # só confere
  python scripts/mudar-endereco.py                          # usa o nome artesana-app
  python scripts/mudar-endereco.py --nome artesana-mktdigital
"""
import argparse
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ANTIGO = "bebezinbtc-droid.github.io/artesana"
CRIAR_ORG = "https://github.com/account/organizations/new?plan=free"
LIBERAR_CLI = "https://github.com/settings/connections/applications/178c6fc778ccc68e1d6a"


def gh(*args: str) -> tuple[int, str]:
    r = subprocess.run(["gh", *args], cwd=RAIZ, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return r.returncode, ((r.stdout or "") + (r.stderr or "")).strip()


def git(*args: str) -> tuple[int, str]:
    r = subprocess.run(["git", "-c", "user.name=bebezinbtc-droid", "-c", "user.email=asic.reparos@gmail.com", *args],
                       cwd=RAIZ, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return r.returncode, ((r.stdout or "") + (r.stderr or "")).strip()


def verificar(nome: str) -> bool:
    codigo, saida = gh("api", f"users/{nome}", "--jq", ".type")
    if codigo != 0:
        print(f"O nome '{nome}' ainda não existe no GitHub. Está livre pra você criar.\n")
        print("Como criar, em cerca de um minuto, logada na sua conta:")
        print(f"  1. Abra {CRIAR_ORG}")
        print(f"  2. Em 'Organization name' digite: {nome}")
        print("  3. Informe um e-mail de contato e marque 'My personal account'")
        print("  4. Conclua sem convidar ninguém")
        print(f"\nDepois rode de novo: python scripts/mudar-endereco.py --nome {nome}")
        return False
    if saida.strip() != "Organization":
        print(f"'{nome}' já existe no GitHub, mas é uma conta de usuário de outra pessoa. Escolha outro nome.")
        return False
    repo = f"{nome}/{nome}.github.io"
    eu = gh("api", "user", "--jq", ".login")[1].strip()

    # convite de colaborador no repositório: esta conta consegue aceitar sozinha
    _, convites = gh("api", "user/repository_invitations", "--jq", f'.[] | select(.repository.full_name == "{repo}") | .id')
    for convite in convites.split():
        if convite.isdigit() and gh("api", "-X", "PATCH", f"user/repository_invitations/{convite}")[0] == 0:
            print(f"convite pro repositório {repo} aceito")

    codigo, admin = gh("api", f"repos/{repo}", "--jq", ".permissions.admin")
    if codigo == 0 and admin.strip() == "true":
        print(f"Repositório {repo} encontrado e a conta {eu} é administradora dele. Pode publicar.")
        return True
    if nome in gh("api", "user/orgs", "--jq", ".[].login")[1].split():
        print(f"A conta {eu} faz parte da organização '{nome}'. Pode publicar.")
        return True

    print(f"A organização '{nome}' existe, mas a conta {eu} ainda não tem acesso.")
    print("Quem é dona da organização precisa fazer dois passos, logada no GitHub:")
    print()
    if codigo != 0:
        print(f"  1. Criar o repositório em https://github.com/organizations/{nome}/repositories/new")
        print(f"       Repository name: {nome}.github.io")
        print("       Marcar Public e não marcar README nem nenhuma outra opção")
    else:
        print(f"  1. O repositório {repo} já existe.")
    print(f"  2. Me dar acesso em https://github.com/{repo}/settings/access")
    print(f"       Add people, digitar {eu}, escolher o papel Admin")
    print()
    print(f"Depois rode de novo: python scripts/mudar-endereco.py --nome {nome}")
    return False


def publicar(nome: str) -> int:
    repo = f"{nome}/{nome}.github.io"
    novo = f"{nome}.github.io"
    codigo, _ = gh("api", f"repos/{repo}", "--silent")
    if codigo != 0:
        codigo, saida = gh("repo", "create", repo, "--public", "--description", "artesaná. — o app da empreendedora que faz, vende e fotografa",
                           "--homepage", f"https://{novo}/")
        if codigo != 0:
            print(f"Não consegui criar o repositório {repo}:\n{saida}\n\nA conta precisa ser Owner da organização. Veja https://github.com/orgs/{nome}/people")
            return 1
        print("repositório criado:", repo)

    _, remotos = git("remote")
    if "antigo" not in remotos.split():
        git("remote", "rename", "origin", "antigo")
    if "origin" not in git("remote")[1].split():
        git("remote", "add", "origin", f"https://github.com/{repo}.git")

    for arq in ["README.md", "scripts/smoke.py", "docs/dominio.md", "marketing/instagram/legendas.md"]:
        p = RAIZ / arq
        if p.exists():
            p.write_text(p.read_text(encoding="utf-8").replace(ANTIGO, novo), encoding="utf-8", newline="\n")
    git("add", "-A")
    git("commit", "-q", "-m", f"feat: site publicado em https://{novo}\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>")
    codigo, saida = git("push", "-u", "origin", "main", "--tags")
    if codigo != 0:
        print("falha no envio:\n" + saida)
        return 1
    gh("api", "-X", "POST", f"repos/{repo}/pages", "-f", "build_type=legacy", "-f", "source[branch]=main", "-f", "source[path]=/")

    print(f"aguardando https://{novo}/ ...")
    for _ in range(60):
        try:
            req = urllib.request.Request(f"https://{novo}/app/", headers={"User-Agent": "Mozilla/5.0"})
            if urllib.request.urlopen(req, timeout=15).status == 200:
                break
        except Exception:
            pass
        time.sleep(10)
    else:
        print("O GitHub ainda não publicou. Confira em alguns minutos.")
        return 1

    r = subprocess.run([sys.executable, "scripts/smoke.py", "--base", f"https://{novo}"], cwd=RAIZ)
    print(f"\nnovo endereço: https://{novo}/   app: https://{novo}/app/")
    print(f"o endereço antigo https://{ANTIGO}/ continua no ar, então links já divulgados não quebram.")
    return r.returncode


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--nome", default="artesana-app", help="nome da organização, que vira <nome>.github.io")
    ap.add_argument("--verificar", action="store_true", help="só confere, não muda nada")
    args = ap.parse_args()
    ok = verificar(args.nome)
    if args.verificar or not ok:
        return 0 if ok else 1
    return publicar(args.nome)


if __name__ == "__main__":
    sys.exit(main())
