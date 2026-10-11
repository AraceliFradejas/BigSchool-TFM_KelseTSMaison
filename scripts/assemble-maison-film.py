"""Assemble a Maison film from ordered clips, with optional locally supplied music."""
import argparse
import json
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('manifest', type=Path)
parser.add_argument('output', type=Path)
parser.add_argument('--music', type=Path, help='Optional locally supplied audio track')
args = parser.parse_args()
manifest = json.loads(args.manifest.read_text())
clips = [(args.manifest.parent / clip['file']).resolve() for clip in manifest['clips']]
if len(clips) < 2:
    parser.error('At least two clips are required')
for source in clips + ([args.music] if args.music else []):
    if not source.is_file():
        parser.error(f'Missing source: {source}')
fade = float(manifest.get('transitionSeconds', 0.5))
durations = []
for clip in clips:
    info = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_format', '-of', 'json', str(clip)]))
    duration = float(info['format']['duration'])
    if duration <= fade * 2:
        parser.error(f'Clip too short for transition: {clip}')
    durations.append(duration)
command = ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error']
for clip in clips:
    command += ['-i', str(clip)]
if args.music:
    command += ['-stream_loop', '-1', '-i', str(args.music)]
filters = [f'[{i}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,fps=24,format=yuv420p,settb=AVTB,setpts=PTS-STARTPTS[v{i}]' for i in range(len(clips))]
previous = 'v0'
elapsed = durations[0]
for i in range(1, len(clips)):
    output = f'fade{i}'
    filters.append(f'[{previous}][v{i}]xfade=transition=fade:duration={fade}:offset={elapsed-fade}[{output}]')
    elapsed += durations[i] - fade
    previous = output
if args.music:
    filters.append(f'[{len(clips)}:a]atrim=duration={elapsed},asetpts=PTS-STARTPTS,volume=0.3,afade=t=in:d=2,afade=t=out:st={max(0,elapsed-2)}:d=2[audio]')
command += ['-filter_complex', ';'.join(filters), '-map', f'[{previous}]']
command += ['-map', '[audio]', '-c:a', 'aac', '-b:a', '128k'] if args.music else ['-an']
args.output.parent.mkdir(parents=True, exist_ok=True)
command += ['-c:v', 'libx264', '-preset', 'medium', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-t', str(elapsed), str(args.output)]
subprocess.run(command, check=True)
print(f'Saved {args.output}: {elapsed:.2f} seconds, {len(clips)} clips')
