"""Publica a versão atual da main no endereço antigo, https://bebezinbtc-droid.github.io/artesana/, sem o
arquivo CNAME.

O endereço antigo serve de espelho: abre mesmo quando o domínio está em transição de DNS, e quem testava o
app lá mantém os próprios dados (o localStorage é por endereço). O CNAME não pode ir junto: com ele, o
GitHub passaria a redirecionar o endereço antigo para o domínio.

Uso: python scripts/espelho.py
"""
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
REMOTO = "antigo"


def git(*args: str, entrada: str | None = None) -> str:
    r = subprocess.run(["git", *args], cwd=RAIZ, capture_output=True, text=True, encoding="utf-8", input=entrada)
    if r.returncode != 0:
        sys.exit(f"falhou: git {' '.join(args)}\n{r.stderr}")
    return r.stdout.strip()


def main() -> None:
    if git("status", "--porcelain"):
        sys.exit("há mudanças não commitadas; commite antes de espelhar")
    main_ = git("rev-parse", "main")
    # árvore da main sem o CNAME da raiz, sem tocar na pasta de trabalho
    entradas = [l for l in git("ls-tree", "main").splitlines() if not l.endswith("\tCNAME")]
    arvore = git("mktree", entrada="\n".join(entradas) + "\n")
    commit = git("commit-tree", arvore, "-p", main_, "-m", f"espelho da main {main_[:7]} sem CNAME")
    git("push", "-f", REMOTO, f"{commit}:refs/heads/main")
    print(f"espelho publicado: {commit[:7]} (main {main_[:7]} sem CNAME) -> {REMOTO}/main")
    print("endereço: https://bebezinbtc-droid.github.io/artesana/")


if __name__ == "__main__":
    main()
