"""Compose individual illustrated walks into desktop boards and a portrait cut."""
import argparse
import json
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('manifest', type=Path)
parser.add_argument('output_dir', type=Path)
parser.add_argument('--music', required=True, type=Path)
args = parser.parse_args()
data = json.loads(args.manifest.read_text())
entries = data['entries']
root = Path.cwd()
out = args.output_dir
out.mkdir(parents=True, exist_ok=True)

def render(inputs, filters, target, duration):
    command = ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-filter_complex_threads', '1']
    for source in inputs:
        command += ['-i', str(source)]
    command += ['-filter_complex', filters, '-map', '[v]', '-an', '-t', str(duration), '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(target)]
    subprocess.run(command, check=True)

boards = []
for group in range(9):
    members = entries[group * 4:(group + 1) * 4]
    sources = [root / e['video'] for e in members]
    for source in sources:
        if not source.is_file():
            raise FileNotFoundError(source)
    # Preserve complete clothes and shoes, with a paper surround rather than cropping.
    filters = [f'[{i}:v]trim=duration=5,setpts=(PTS-STARTPTS)/0.72,scale=480:1000:force_original_aspect_ratio=decrease,pad=480:1080:(ow-iw)/2:(oh-ih)/2:color=0xf5efe4,fps=24,setsar=1,format=yuv420p[p{i}]' for i in range(4)]
    filters += ['[p0][p1][p2][p3]hstack=inputs=4[v]']
    target = out / f'board-{group:02d}.mp4'
    render(sources, ';'.join(filters), target, 5 / 0.72)
    boards.append({'file': target.name})
    print(f'Board {group+1}/9', flush=True)
(out / 'desktop.json').write_text(json.dumps({'transitionSeconds': 0.125, 'clips': boards}, indent=2))
portrait = []
for index, entry in enumerate(entries):
    target = out / f'portrait-{index:02d}.mp4'
    render([root / entry['video']], '[0:v]trim=start=1:duration=2.5,setpts=PTS-STARTPTS,scale=1080:1440:force_original_aspect_ratio=decrease,pad=1080:1440:(ow-iw)/2:(oh-ih)/2:color=0xf5efe4,fps=24,setsar=1,format=yuv420p[v]', target, 2.5)
    portrait.append({'file': target.name})
(out / 'portrait.json').write_text(json.dumps({'transitionSeconds': 0.0833333333, 'clips': portrait}, indent=2))
for manifest, filename in [('desktop.json','maison-film-sketch-walk.mp4'),('portrait.json','maison-film-sketch-walk-mobile.mp4')]:
    sequence = json.loads((out / manifest).read_text())['clips']
    sources = [out / clip['file'] for clip in sequence]
    duration = sum(float(json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-of','json',str(source)]))['format']['duration']) for source in sources)
    concat = out / (manifest + '.concat.txt')
    concat.write_text(''.join("file '" + str(source.resolve()).replace("'", "'\\''") + "'\n" for source in sources))
    # Straight editorial cuts keep the step visible, avoiding blended/doubled shoes.
    audio = f'[1:a]atrim=duration={duration},asetpts=PTS-STARTPTS,volume=0.7,afade=t=in:d=2,afade=t=out:st={duration-2}:d=2[a]'
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',str(concat),'-i',str(args.music),'-filter_complex',audio,'-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','128k','-t',str(duration),'-movflags','+faststart',str(out/filename)],check=True)
    print(f'Saved {filename}: {duration:.3f} seconds', flush=True)
