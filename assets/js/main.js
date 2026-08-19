document.addEventListener('DOMContentLoaded',function(){
  const select = document.getElementById('category');
  const jobs = document.querySelectorAll('.job');

  // lazy-load and dynamic images via manifest
  fetch('/assets/images/manifest.json').then(r=>r.json()).then(manifest=>{
    document.querySelectorAll('img[data-key]').forEach(img=>{
      const key = img.getAttribute('data-key');
      if(manifest && manifest[key]){
        const entry = manifest[key];
        const primary = entry.primary || (entry.images && entry.images[0]);
        if(primary) img.src = '/assets/images/' + primary;
        // if there are multiple images, make the card clickable to open a simple carousel
        if(entry.images && entry.images.length>1){
          img.style.cursor = 'pointer';
          img.addEventListener('click', ()=>openCarousel(entry.images, 0));
        }
      }
      img.loading = 'lazy';
    });
  }).catch(()=>{
    // ensure lazy attribute even if manifest fails
    document.querySelectorAll('img[data-key]').forEach(img=>img.loading='lazy');
  });

  // simple carousel modal
  function openCarousel(images, start){
    let idx = start;
    const modal = document.createElement('div');
    modal.style.position='fixed';modal.style.left=0;modal.style.top=0;modal.style.right=0;modal.style.bottom=0;modal.style.background='rgba(0,0,0,0.8)';modal.style.display='flex';modal.style.alignItems='center';modal.style.justifyContent='center';modal.style.zIndex=9999;
    const img = document.createElement('img'); img.style.maxWidth='90%'; img.style.maxHeight='90%'; img.style.boxShadow='0 8px 30px rgba(0,0,0,0.6)';
    const left = document.createElement('button'); left.textContent='<'; left.style.position='absolute'; left.style.left='20px'; left.style.fontSize='24px'; left.style.background='transparent'; left.style.color='#fff'; left.style.border=0;
    const right = document.createElement('button'); right.textContent='>'; right.style.position='absolute'; right.style.right='20px'; right.style.fontSize='24px'; right.style.background='transparent'; right.style.color='#fff'; right.style.border=0;
    function render(){ img.src = '/assets/images/' + images[idx]; }
    left.onclick = ()=>{ idx = (idx-1+images.length)%images.length; render(); };
    right.onclick = ()=>{ idx = (idx+1)%images.length; render(); };
    modal.addEventListener('click',(e)=>{ if(e.target===modal) document.body.removeChild(modal); });
    modal.appendChild(left); modal.appendChild(img); modal.appendChild(right); render(); document.body.appendChild(modal);
  }

  if(select){
    select.addEventListener('change',function(){
      const val = this.value;
      jobs.forEach(j=>{
        if(val==='all' || j.dataset.category===val){
          j.style.display='block';
        } else { j.style.display='none'; }
      });
    });
  }

  // Requirements toggle behavior (delegation)
  document.getElementById('jobs')?.addEventListener('click', function(e){
    const btn = e.target.closest && e.target.closest('.req-toggle');
    if(!btn) return;
    const card = btn.closest('.job');
    const panel = card.querySelector('.requirements');
    if(!panel) return;
    const isShown = panel.classList.toggle('show');
    panel.setAttribute('aria-hidden', String(!isShown));
    btn.textContent = isShown ? 'Hide requirements' : 'Requirements';
  });

  // populate requirement panels from jobs data (if available)
  fetch('/assets/data/jobs.json').then(r=>r.json()).then(jobsData=>{
    document.querySelectorAll('.job').forEach(card=>{
      const id = card.getAttribute('data-job');
      if(!id) return;
      const info = jobsData[id];
      const panel = card.querySelector('.requirements');
      if(panel && info && Array.isArray(info.requirements)){
        const ul = panel.querySelector('ul');
        if(ul){ ul.innerHTML = info.requirements.map(it => '<li>'+it+'</li>').join(''); }
      }
    });
  }).catch(()=>{});
});
