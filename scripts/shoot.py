import subprocess, sys
from PIL import Image
pages = {"home":"/","reclamation":"/reclamation/","restoration":"/reclamation/restoration/","agriculture":"/agriculture/",
         "contact":"/contact/","blog":"/blog/","post-supern-name":"/blog/supern-is-the-new-name-for-terrarevive/",
         "post-aer-two-year":"/blog/the-aer-two-year-wait/","404":"/404.html"}
BONE=(239,233,221)
def crop(path):
    im=Image.open(path).convert("RGB"); w,h=im.size; px=im.load()
    y=h-1
    while y>0:
        row=[px[x,y] for x in range(0,w,max(1,w//40))]
        if any(abs(r-BONE[0])+abs(g-BONE[1])+abs(b-BONE[2])>12 for r,g,b in row): break
        y-=1
    im.crop((0,0,w,y+1)).save(path, optimize=True)
    return w,y+1
for vw,suffix in [(1280,"desktop"),(390,"mobile")]:
    for name,url in pages.items():
        out=f"screenshots/{name}-{suffix}.png"
        subprocess.run(["google-chrome","--headless","--no-sandbox","--hide-scrollbars","--disable-gpu",
            f"--window-size={vw},14000","--virtual-time-budget=8000",f"--screenshot={out}",f"http://localhost:8765{url}"],
            capture_output=True, timeout=120)
        print(out, crop(out))
