"""Reframe the finished Maison film for the mobile hero without new generations."""
import argparse
import json
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('manifest', type=Path)
parser.add_argument('source', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
recipe = json.loads(args.manifest.read_text())
scenes = recipe['scenes']
fade = recipe['transitionSeconds']
expression = str(scenes[-1]['horizontalCenterFraction'])
for index in range(len(scenes) - 1, 0, -1):
    start = scenes[index]['startSeconds']
    previous = scenes[index - 1]['horizontalCenterFraction']
    current = scenes[index]['horizontalCenterFraction']
    expression = (
        f'if(lt(t,{start}),{previous},'
        f'if(lt(t,{start + fade}),{previous}+({current - previous})*'
        f'(t-{start})/{fade},{expression}))'
    )
args.output.parent.mkdir(parents=True, exist_ok=True)
subprocess.run([
    'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', str(args.source),
    '-vf', f"crop=ih*3/4:ih:x='{expression}*iw-ow/2':y=0,scale=1080:1440",
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-c:a', 'copy',
    '-movflags', '+faststart', str(args.output),
], check=True)
