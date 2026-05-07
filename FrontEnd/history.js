const totalLevels = 5;
function nav(level, mode){localStorage.setItem('navigateToLevel', String(level));localStorage.setItem('navigateMode', mode);location.href='../index.html';}
async function init(){const state=await GTMStorage.load();const stats=await GTMStorage.computeStats(totalLevels);const c=document.getElementById('history-container');const s=document.getElementById('summary');s.style.display='grid';s.innerHTML=`<div class='box'><div class='label'>Solved</div><div class='value'>${stats.solved}/${stats.totalLevels}</div></div><div class='box'><div class='label'>Failed</div><div class='value'>${stats.failed}</div></div><div class='box'><div class='label'>In progress</div><div class='value'>${stats.inProgress}</div></div>`;document.getElementById('tamper-warning').classList.toggle('hidden',!stats.tampered);
const firstPlayable=await GTMStorage.getFirstPlayableLevel(totalLevels);
for(let i=0;i<totalLevels;i++){const lvl=await GTMStorage.getLevelState(i);const item=document.createElement('div');item.className='history-item';let status='Locked',mode='locked',clickable=false;
if(lvl.status==='solved'){status='Solved';mode='view';clickable=true;item.classList.add('correct');}
else if(lvl.status==='failed'){status='Failed';mode='view';clickable=true;item.classList.add('failed');}
else if(lvl.status==='in_progress'){status='In progress';mode='play';clickable=true;item.classList.add('in-progress');}
else if(i===firstPlayable){status='Playable';mode='play';clickable=true;item.classList.add('playable');}
else item.classList.add('locked');
item.innerHTML=`<span class='level'>Level ${i+1}</span><span class='attempts'>Attempts: ${lvl.attemptsMade}/4</span><span class='status'>${status}</span>`;
if(clickable){item.addEventListener('click',()=>nav(i,mode));}else item.setAttribute('aria-disabled','true');
c.appendChild(item);} 

document.getElementById('export-btn').addEventListener('click',async()=>{const blob=new Blob([await GTMStorage.exportAsJsonString()],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='guess-the-manga-progress.json';a.click();URL.revokeObjectURL(a.href);});
}
document.addEventListener('DOMContentLoaded',init);
