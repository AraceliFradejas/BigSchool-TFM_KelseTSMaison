"""Assemble a Maison film from ordered clips, with optional locally supplied music."""
import argparse
import json
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('manifest', type=Path)
parser.add_argument('output', type=Path)
parser.add_argument('--music', type=Path, help='Optional locally supplied audio track')
parser.add_argument('--width', type=int, default=1280)
parser.add_argument('--height', type=int, default=720)
parser.add_argument('--speed', type=float, default=1, help='Playback speed; 0.95 gives a gentle runway pace')
parser.add_argument('--crf', type=int, default=20, help='H.264 quality, 0–51; lower preserves more detail (default 20)')
args = parser.parse_args()
if not 0 <= args.crf <= 51:
    parser.error('--crf must be between 0 and 51')
if args.width <= 0 or args.height <= 0 or args.width % 2 or args.height % 2:
    parser.error('Dimensions must be positive even numbers')
if not 0.5 <= args.speed <= 2:
    parser.error('--speed must be between 0.5 and 2')
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
filters = [f'[{i}:v]scale={args.width}:{args.height}:force_original_aspect_ratio=decrease,pad={args.width}:{args.height}:(ow-iw)/2:(oh-ih)/2,fps=24,format=yuv420p,settb=AVTB,setpts=PTS-STARTPTS[v{i}]' for i in range(len(clips))]
previous = 'v0'
elapsed = durations[0]
for i in range(1, len(clips)):
    output = f'fade{i}'
    filters.append(f'[{previous}][v{i}]xfade=transition=fade:duration={fade}:offset={elapsed-fade}[{output}]')
    elapsed += durations[i] - fade
    previous = output
if args.speed != 1:
    filters.append(f'[{previous}]setpts=PTS/{args.speed},fps=24[speed]')
    previous = 'speed'
    elapsed /= args.speed
if args.music:
    filters.append(f'[{len(clips)}:a]atrim=duration={elapsed},asetpts=PTS-STARTPTS,volume=0.7,afade=t=in:d=2,afade=t=out:st={max(0,elapsed-2)}:d=2[audio]')
command += ['-filter_complex', ';'.join(filters), '-map', f'[{previous}]']
command += ['-map', '[audio]', '-c:a', 'aac', '-b:a', '128k'] if args.music else ['-an']
args.output.parent.mkdir(parents=True, exist_ok=True)
command += ['-c:v', 'libx264', '-preset', 'medium', '-crf', str(args.crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-t', str(elapsed), str(args.output)]
subprocess.run(command, check=True)
print(f'Saved {args.output}: {elapsed:.2f} seconds, {len(clips)} clips')
