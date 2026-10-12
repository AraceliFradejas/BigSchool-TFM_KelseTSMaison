"""Show every outfit from the four-panel film in sequence for the mobile hero."""
import argparse
import json
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('manifest', type=Path)
parser.add_argument('output_directory', type=Path)
args = parser.parse_args()
recipe = json.loads(args.manifest.read_text())
args.output_directory.mkdir(parents=True, exist_ok=True)
segments = []
for index, clip in enumerate(recipe['clips']):
    source = (args.manifest.parent / clip['file']).resolve()
    metadata = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_format', '-of', 'json', str(source),
    ]))
    quarter = float(metadata['format']['duration']) / 4
    for panel in range(4):
        target = args.output_directory / f'{index:02d}-{panel}.mp4'
        subprocess.run([
            'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
            '-ss', str(panel * quarter), '-i', str(source), '-t', str(quarter),
            '-vf', f'crop=iw/4:ih:iw*{panel}/4:0,scale=-2:1440,'
                   'pad=1080:1440:(ow-iw)/2:0:color=0xf5efe4,fps=24',
            '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
            '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(target),
        ], check=True)
        segments.append({'file': target.name, 'chapter': clip['chapter'], 'panel': panel + 1})
(args.output_directory / 'manifest.json').write_text(json.dumps({
    'transitionSeconds': 0.125, 'clips': segments,
}, ensure_ascii=False, indent=2) + '\n')
