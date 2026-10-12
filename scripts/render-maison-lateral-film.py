"""Compose an ordered lateral fashion show with stable drawings and a moving backdrop."""
import argparse
import json
import subprocess
from pathlib import Path

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('manifest',type=Path)
parser.add_argument('--mobile',action='store_true')
parser.add_argument('--duration',type=float,default=90)
parser.add_argument('--output',type=Path)
args=parser.parse_args()
manifest=json.loads(args.manifest.read_text())
root=Path.cwd()
private=args.manifest.parent
cycles=private/'cycles';cycles.mkdir(exist_ok=True)
entries=manifest['looks']
# Four poses at 3.75 fps: a quarter slower than the accepted 5 fps pilot.
for look in entries:
    target=cycles/(look['id']+'.mov')
    source=root/look['frames']
    frames=list(source.parent.glob(source.name.replace('%d','*')))
    if len(frames)!=4:
        raise ValueError(f'Expected four poses for {look["id"]}: {source}')
    if not target.exists() or target.stat().st_mtime < max(frame.stat().st_mtime for frame in frames):
        subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-framerate','15/4','-i',str(source),'-frames:v','4','-c:v','qtrle','-pix_fmt','argb',str(target)],check=True)

width,height,size,velocity,y=(1080,1920,1320,0,490) if args.mobile else (1920,1080,720,200,300)
background_width=height*3
command=['ffmpeg','-y','-hide_banner','-loglevel','error','-filter_complex_threads','1','-loop','1','-i',str(root/manifest['background'])]
for look in entries:
    command+=['-stream_loop','-1','-i',str(cycles/(look['id']+'.mov'))]
command+=['-i',str(root/manifest['music'])]
filters=[f'[0:v]scale={background_width}:{height},crop={width}:{height}:x={(background_width-width)}*t/{args.duration}:y=0,fps=24,format=rgba[bg]']
previous='bg'
for i,look in enumerate(entries,start=1):
    # Keep every garment complete in a portrait viewport. The moving scenery is continuous;
    # each look has its own 2.5-second close view rather than overlapping its neighbours.
    if args.mobile:
        entry=(i-1)*2.5
        exit=entry+2.5
        left=look['bounds']['left']*size/640
        garment_width=look['bounds']['width']*size/640
        travel=max(0,1000-garment_width-48)
        trajectory=f'64-{left}+{travel}*(t-({entry}))/2.5'
        enabled=f'gte(t,{entry})*lt(t,{exit})'
    else:
        entry=look['entrySeconds']
        exit=entry+(width+size)/velocity
        trajectory=f'-{size}+{velocity}*(t-({entry}))'
        enabled=f'between(t,{max(0,entry)},{exit})'
    # Both the trajectory and all limb poses are predetermined; no per-frame generation.
    start=max(0,entry)
    filters+=[f'[{i}:v]trim=start={start}:end={exit},setpts=PTS-STARTPTS+{start}/TB,scale={size}:{size},format=rgba,fps=24[s{i}]',f"[{previous}][s{i}]overlay=x={trajectory}:y={y}:eval=frame:enable='{enabled}':shortest=0[v{i}]"]
    previous=f'v{i}'
filters+=[f'[{previous}]format=yuv420p[v]',f'[{len(entries)+1}:a]atrim=duration={args.duration},asetpts=PTS-STARTPTS,volume=0.7,afade=t=in:d=2,afade=t=out:st={args.duration-2}:d=2[a]']
output=args.output or Path('frontend/public/media')/('maison-film-lateral-mobile.mp4' if args.mobile else 'maison-film-lateral.mp4')
output.parent.mkdir(exist_ok=True,parents=True)
command+=['-filter_complex',';'.join(filters),'-map','[v]','-map','[a]','-t',str(args.duration),'-c:v','libx264','-preset','medium','-crf','20','-c:a','aac','-b:a','128k','-movflags','+faststart',str(output)]
subprocess.run(command,check=True)
print(f'Saved {output}: {args.duration} s, {len(entries)} looks',flush=True)
