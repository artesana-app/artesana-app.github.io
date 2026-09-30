"""Vira o site para o domínio oficial, mas só depois de conferir que o DNS já aponta para o GitHub Pages.

Se o DNS ainda não estiver pronto, mostra o que falta e sai sem mexer em nada.
Virar antes da hora derruba o site: o endereço antigo passa a redirecionar para um domínio que não abre.

Uso:
  python scripts/ativar-dominio.py --verificar     # só confere o DNS
  python scripts/ativar-dominio.py                 # confere e, se estiver certo, vira o site
  python scripts/ativar-dominio.py --esperar 24    # fica conferindo por até 24 horas e vira sozinho quando o DNS mudar

O push vai só para o repositório oficial. O repositório anterior (bebezinbtc-droid/artesana) não recebe o
arquivo CNAME: se recebesse, o endereço antigo passaria a redirecionar para o domínio e quem testava lá
perderia o acesso aos próprios dados.
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


def _repo_atual() -> str:
    """Repositório do remoto origin, pra funcionar também depois de mudar o endereço do GitHub."""
    r = subprocess.run(["git", "remote", "get-url", "origin"], cwd=RAIZ, capture_output=True, text=True)
    url = (r.stdout or "").strip().removesuffix(".git")
    return "/".join(url.split("/")[-2:]) if url else "bebezinbtc-droid/artesana"


REPO = _repo_atual()
DONO, NOME_REPO = REPO.split("/")
ANTIGO = f"{DONO}.github.io" if NOME_REPO == f"{DONO}.github.io" else f"{DONO}.github.io/{NOME_REPO}"
PAGES_A = {"185.199.108.153", "185.199.109.153", "185.199.110.153", "185.199.111.153"}
PAGES_AAAA = {"2606:50c0:8000::153", "2606:50c0:8001::153", "2606:50c0:8002::153", "2606:50c0:8003::153"}
PAGES_WWW = f"{DONO}.github.io"


def agora() -> str:
    return time.strftime("%d/%m %H:%M:%S")


def consulta(nome: str, tipo: str) -> list[str]:
    """Pergunta ao DNS público do Google, pra não depender do cache desta máquina."""
    url = f"https://dns.google/resolve?name={nome}&type={tipo}"
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=20) as r:
        dados = json.load(r)
    numero = {"A": 1, "AAAA": 28, "CNAME": 5}[tipo]
    return [a["data"].rstrip(".") for a in dados.get("Answer", []) if a.get("type") == numero]


def verificar(quieto: bool = False) -> bool:
    a = set(consulta(DOMINIO, "A"))
    aaaa = set(consulta(DOMINIO, "AAAA"))
    www_cname = consulta(f"www.{DOMINIO}", "CNAME")
    www_a = set(consulta(f"www.{DOMINIO}", "A"))
    ok_a = bool(a) and a <= PAGES_A
    ok_www = PAGES_WWW in www_cname or (bool(www_a) and www_a <= PAGES_A)
    if aaaa and not aaaa <= PAGES_AAAA:
        estado_aaaa = "ERRADO: aponta pra outro servidor, quem usa IPv6 não chega no site"
    elif aaaa:
        estado_aaaa = "certo"
    else:
        estado_aaaa = "ausente, opcional"
    if quieto:
        return ok_a
    print(f"A     {DOMINIO}: {sorted(a) or 'nenhum'}  {'certo' if ok_a else 'FALTA'}")
    print(f"AAAA  {DOMINIO}: {sorted(aaaa) or 'nenhum'}  {estado_aaaa}")
    print(f"www.{DOMINIO}: {www_cname or sorted(www_a) or 'nenhum'}  {'certo' if ok_www else 'sem www, opcional'}")
    if not ok_a:
        print("\nO domínio ainda não aponta para o GitHub Pages. No painel do Registro.br, em Configurar endereçamento,")
        print(f"o campo 'Endereço do site' recebe o IP {sorted(PAGES_A)[0]} no lugar do redirecionamento.")
        print("Passo a passo em docs/dominio.md. Depois rode este script de novo.")
    return ok_a


def rodar(*cmd: str, checar: bool = True) -> str:
    r = subprocess.run(cmd, cwd=RAIZ, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if checar and r.returncode != 0:
        sys.exit(f"falhou: {' '.join(cmd)}\n{r.stdout}\n{r.stderr}")
    return (r.stdout or "") + (r.stderr or "")


def abre(url: str) -> int:
    """Código HTTP da página, sem seguir redirecionamento. 0 se a conexão ou o certificado falharem."""
    class SemRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *a, **k):
            return None
    try:
        with urllib.request.build_opener(SemRedirect).open(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=20) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0


def virar() -> None:
    pushes = rodar("git", "remote", "get-url", "--push", "--all", "origin").split()
    assert pushes == [f"https://github.com/{REPO}.git"], f"origin ainda faz push pra mais de um repositório: {pushes}"
    assert not rodar("git", "status", "--porcelain").strip(), "há mudanças não commitadas; commite ou descarte antes de virar"

    (RAIZ / "CNAME").write_text(DOMINIO + "\n", encoding="utf-8", newline="\n")
    for arq in ["README.md", "scripts/smoke.py", "marketing/instagram/publicacoes.json"]:
        p = RAIZ / arq
        p.write_text(p.read_text(encoding="utf-8").replace(f"https://{ANTIGO}", f"https://{DOMINIO}"), encoding="utf-8", newline="\n")
    rodar(sys.executable, "scripts/gen-instagram-pagina.py")
    rodar("git", "add", "-A")
    rodar("git", "-c", "user.name=bebezinbtc-droid", "-c", "user.email=asic.reparos@gmail.com", "commit", "-q", "-m",
          f"feat: site no domínio oficial {DOMINIO}\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>")
    rodar("git", "push", "-q", "origin", "main")
    rodar("gh", "api", "-X", "PUT", f"repos/{REPO}/pages", "-f", f"cname={DOMINIO}")
    print(f"{agora()} domínio definido no GitHub Pages. Aguardando o certificado HTTPS (costuma levar alguns minutos)...", flush=True)
    # o GitHub pode gravar o CNAME por conta própria; mantém o clone em dia
    rodar("git", "pull", "-q", "--rebase", "origin", "main", checar=False)

    for _ in range(40):
        r = subprocess.run(["gh", "api", "-X", "PUT", f"repos/{REPO}/pages", "-F", "https_enforced=true"], cwd=RAIZ, capture_output=True)
        if r.returncode == 0:
            print(f"{agora()} HTTPS obrigatório ligado.", flush=True)
            break
        time.sleep(30)
    else:
        print(f"{agora()} O certificado ainda não saiu. O site já abre por http; rode este script de novo mais tarde pra ligar o HTTPS.", flush=True)

    for _ in range(60):
        if abre(f"https://{DOMINIO}/") == 200:
            print(f"{agora()} https://{DOMINIO}/ abre com certificado válido.", flush=True)
            break
        time.sleep(30)
    else:
        print(f"{agora()} https://{DOMINIO}/ ainda não abre; conferir mais tarde.", flush=True)
    print(f"{agora()} endereço antigo: https://{ANTIGO}/ responde {abre(f'https://{ANTIGO}/')} (301 = já redireciona pro domínio)", flush=True)
    r = subprocess.run([sys.executable, "scripts/smoke.py", "--base", f"https://{DOMINIO}"], cwd=RAIZ, capture_output=True, text=True, encoding="utf-8", errors="replace")
    print(f"{agora()} smoke no domínio: {'passou' if r.returncode == 0 else 'FALHOU'}\n{(r.stdout or '')[-1500:]}{(r.stderr or '')[-800:]}", flush=True)
    print(f"{agora()} pronto: https://{DOMINIO}/  e  https://{DOMINIO}/app/", flush=True)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--verificar", action="store_true", help="só confere o DNS, não muda nada")
    ap.add_argument("--esperar", type=float, metavar="HORAS", help="fica conferindo o DNS a cada minuto e vira quando estiver certo")
    args = ap.parse_args()
    if args.esperar:
        print(f"{agora()} esperando o DNS de {DOMINIO} apontar para o GitHub Pages (até {args.esperar:g} h)...", flush=True)
        fim = time.time() + args.esperar * 3600
        while time.time() < fim:
            try:
                if verificar(quieto=True):
                    break
            except Exception as e:
                print(f"{agora()} consulta falhou, tento de novo: {e}", flush=True)
            time.sleep(60)
        else:
            print(f"{agora()} o prazo acabou e o DNS não mudou. Nada foi feito.", flush=True)
            return 1
        print(f"{agora()} DNS mudou:", flush=True)
    ok = verificar()
    if args.verificar or not ok:
        return 0 if ok else 1
    virar()
    return 0


if __name__ == "__main__":
    sys.exit(main())
