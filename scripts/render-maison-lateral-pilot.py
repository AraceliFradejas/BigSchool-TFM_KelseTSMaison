"""Render a controlled side-on illustrated procession, without generative video."""
import subprocess
from pathlib import Path
p=Path('docbase/hero-lateral-v1')
for name in ['trench','tuxedo']:
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-framerate','5','-i',str(p/'frames'/f'{name}-%d.png'),'-frames:v','4','-c:v','qtrle','-pix_fmt','argb',str(p/f'{name}-cycle.mov')],check=True)
command=['ffmpeg','-y','-hide_banner','-loglevel','error','-filter_complex_threads','1','-loop','1','-i',str(p/'promenade.png')]
for name in ['trench','tuxedo','trench','tuxedo']:
    command += ['-stream_loop','-1','-i',str(p/f'{name}-cycle.mov')]
command += ['-i','frontend/public/music/Runway Pulse.mp3']
filters=['[0:v]scale=2160:720,crop=1280:720:x=880*t/20:y=0,fps=24,format=rgba[bg]']
previous='bg'
for index,start in enumerate([-4,2,8,14],start=1):
    filters += [f'[{index}:v]fps=24,format=rgba[s{index}]',f'[{previous}][s{index}]overlay=x=-640+160*(t-({start})):y=80:eval=frame:shortest=1[v{index}]']
    previous=f'v{index}'
filters += [f'[{previous}]format=yuv420p[v]','[5:a]atrim=duration=20,asetpts=PTS-STARTPTS,volume=0.7,afade=t=in:d=1,afade=t=out:st=19:d=1[a]']
output=Path('frontend/public/media/maison-lateral-pilot.mp4')
command += ['-filter_complex',';'.join(filters),'-map','[v]','-map','[a]','-t','20','-c:v','libx264','-preset','medium','-crf','18','-c:a','aac','-b:a','128k','-movflags','+faststart',str(output)]
subprocess.run(command,check=True)
print(f'Saved {output}: 20 s; two outfits in four successive passages')
