"""Gera fotos realistas na placa de vídeo local, com o modelo RealVisXL V5.0 (licença OpenRAIL++).

Precisa de placa NVIDIA com 8 GB e de uma pasta de trabalho fora do repo. O padrão é D:/artesana-ia;
para usar outra, defina a variável ARTESANA_IA. A pasta tem:
  venv/     ambiente Python com torch (CUDA), diffusers, transformers, accelerate, safetensors,
            sentencepiece, protobuf e pillow
  modelos/  RealVisXL_V5.0_fp16.safetensors, de huggingface.co/SG161222/RealVisXL_V5.0

Uso, com o python da pasta de trabalho:
  python scripts/gen-fotos-ia.py marketing/instagram/ia/cenas.json                 todas as cenas
  python scripts/gen-fotos-ia.py marketing/instagram/ia/cenas.json costura         só essa cena
  python scripts/gen-fotos-ia.py marketing/instagram/ia/cenas.json costura:41,42   outras sementes

Saída em <pasta de trabalho>/saida/<cena>-<semente>.jpg. A mesma semente dá a mesma imagem.
Depois de escolher, copie para marketing/instagram/ia/<cena>.jpg e confira mãos e rostos em zoom.
"""
import json
import os
import sys
import time
from pathlib import Path

AQUI = Path(os.environ.get("ARTESANA_IA", "D:/artesana-ia"))
os.environ.setdefault("HF_HOME", str(AQUI / "hf"))
os.environ.setdefault("TMP", str(AQUI / "tmp"))
os.environ.setdefault("TEMP", str(AQUI / "tmp"))

import torch  # noqa: E402
from diffusers import DPMSolverMultistepScheduler, StableDiffusionXLPipeline  # noqa: E402

MODELO = AQUI / "modelos" / "RealVisXL_V5.0_fp16.safetensors"
SAIDA = AQUI / "saida"

NEGATIVO = ("illustration, painting, drawing, cartoon, anime, 3d render, cgi, plastic skin, airbrushed skin, wax figure, doll, "
            "overly smooth skin, heavy makeup, glamour, fashion model, studio backdrop, text, letters, watermark, logo, signature, "
            "brand name, three hands, extra hands, extra arms, deformed hands, extra fingers, fused fingers, missing fingers, extra limbs, bad anatomy, cross-eyed, "
            "blurry, low quality, jpeg artifacts, oversaturated, hdr")


def main() -> None:
    cenas = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    pedidos = {}
    for a in sys.argv[2:]:
        nome, _, sem = a.partition(":")
        pedidos[nome] = [int(s) for s in sem.split(",")] if sem else None

    pipe = StableDiffusionXLPipeline.from_single_file(str(MODELO), torch_dtype=torch.float16, use_safetensors=True)
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config, use_karras_sigmas=True, algorithm_type="dpmsolver++")
    pipe.enable_model_cpu_offload()
    pipe.vae.enable_tiling()
    pipe.set_progress_bar_config(disable=True)
    SAIDA.mkdir(exist_ok=True)

    for cena in cenas:
        n_tokens = len(pipe.tokenizer(cena["prompt"]).input_ids)
        assert n_tokens <= 77, f"{cena['nome']}: prompt com {n_tokens} tokens, o modelo lê só 77"
    for cena in cenas:
        nome = cena["nome"]
        if pedidos and nome not in pedidos:
            continue
        sementes = (pedidos.get(nome) if pedidos else None) or cena["sementes"]
        for semente in sementes:
            destino = SAIDA / f"{nome}-{semente}.jpg"
            if destino.exists() and not cena.get("refazer"):
                print("já existe", destino.name)
                continue
            t = time.time()
            img = pipe(
                prompt=cena["prompt"],
                negative_prompt=cena.get("negativo", NEGATIVO),
                width=cena["largura"], height=cena["altura"],
                num_inference_steps=cena.get("passos", 32),
                guidance_scale=cena.get("guia", 4.5),
                generator=torch.Generator("cpu").manual_seed(semente),
            ).images[0]
            img.save(destino, quality=95)
            print(f"{destino.name}  {img.size}  {time.time() - t:.0f}s", flush=True)


if __name__ == "__main__":
    main()
