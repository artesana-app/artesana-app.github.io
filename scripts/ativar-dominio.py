"""Vira o site para o domínio oficial, mas só depois de conferir que o DNS já aponta para o GitHub Pages.

Se o DNS ainda não estiver pronto, mostra o que falta e sai sem mexer em nada.
Virar antes da hora derruba o site: o endereço antigo passa a redirecionar para um domínio que não abre.

Uso:
  python scripts/ativar-dominio.py --verificar   # só confere o DNS
  python scripts/ativar-dominio.py               # confere e, se estiver certo, vira o site
"""
import argparse
import json
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DOMINIO = "artesana-mktdigital.com.br"
REPO = "bebezinbtc-droid/artesana"
ANTIGO = "bebezinbtc-droid.github.io/artesana"
PAGES_A = {"185.199.108.153", "185.199.109.153", "185.199.110.153", "185.199.111.153"}
PAGES_AAAA = {"2606:50c0:8000::153", "2606:50c0:8001::153", "2606:50c0:8002::153", "2606:50c0:8003::153"}
PAGES_WWW = "bebezinbtc-droid.github.io"


def consulta(nome: str, tipo: str) -> list[str]:
    """Pergunta ao DNS público do Google, pra não depender do cache desta máquina."""
    url = f"https://dns.google/resolve?name={nome}&type={tipo}"
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=20) as r:
        dados = json.load(r)
    numero = {"A": 1, "AAAA": 28, "CNAME": 5}[tipo]
    return [a["data"].rstrip(".") for a in dados.get("Answer", []) if a.get("type") == numero]


def verificar() -> bool:
    a = set(consulta(DOMINIO, "A"))
    aaaa = set(consulta(DOMINIO, "AAAA"))
    www = consulta(f"www.{DOMINIO}", "CNAME")
    ok_a = bool(a) and a <= PAGES_A
    ok_www = PAGES_WWW in www
    print(f"A     {DOMINIO}: {sorted(a) or 'nenhum'}  {'certo' if ok_a else 'FALTA'}")
    print(f"AAAA  {DOMINIO}: {sorted(aaaa) or 'nenhum'}  {'certo' if aaaa and aaaa <= PAGES_AAAA else 'opcional, ausente'}")
    print(f"CNAME www.{DOMINIO}: {www or 'nenhum'}  {'certo' if ok_www else 'recomendado, ausente'}")
    if not ok_a:
        print("\nO domínio ainda não aponta para o GitHub Pages. Crie no painel de DNS do Registro.br:")
        for ip in sorted(PAGES_A):
            print(f"  A      (vazio)   {ip}")
        print(f"  CNAME  www       {PAGES_WWW}")
        print("Passo a passo em docs/dominio.md. Depois rode este script de novo.")
    return ok_a


def rodar(*cmd: str, checar: bool = True) -> str:
    r = subprocess.run(cmd, cwd=RAIZ, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if checar and r.returncode != 0:
        sys.exit(f"falhou: {' '.join(cmd)}\n{r.stdout}\n{r.stderr}")
    return (r.stdout or "") + (r.stderr or "")


def virar() -> None:
    (RAIZ / "CNAME").write_text(DOMINIO + "\n", encoding="utf-8", newline="\n")
    for arq in ["README.md", "scripts/smoke.py"]:
        p = RAIZ / arq
        p.write_text(p.read_text(encoding="utf-8").replace(f"https://{ANTIGO}", f"https://{DOMINIO}"), encoding="utf-8", newline="\n")
    rodar("git", "add", "-A")
    rodar("git", "-c", "user.name=bebezinbtc-droid", "-c", "user.email=asic.reparos@gmail.com", "commit", "-q", "-m",
          f"feat: site no domínio oficial {DOMINIO}\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>")
    rodar("git", "push", "-q", "origin", "main")
    rodar("gh", "api", "-X", "PUT", f"repos/{REPO}/pages", "-f", f"cname={DOMINIO}")
    print("domínio definido no GitHub Pages. Aguardando o certificado HTTPS (pode levar alguns minutos)...")
    for tentativa in range(40):
        r = subprocess.run(["gh", "api", "-X", "PUT", f"repos/{REPO}/pages", "-F", "https_enforced=true"], cwd=RAIZ, capture_output=True)
        if r.returncode == 0:
            print("HTTPS obrigatório ligado.")
            break
        time.sleep(30)
    else:
        print("O certificado ainda não saiu. O site já abre por http; rode este script de novo mais tarde pra ligar o HTTPS.")
    print(f"pronto: https://{DOMINIO}/  e  https://{DOMINIO}/app/")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--verificar", action="store_true", help="só confere o DNS, não muda nada")
    args = ap.parse_args()
    ok = verificar()
    if args.verificar or not ok:
        return 0 if ok else 1
    virar()
    return 0


if __name__ == "__main__":
    sys.exit(main())
