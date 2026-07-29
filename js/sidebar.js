export function initSidebar(state){
 const app=document.querySelector('.app'),toggle=document.querySelector('#sidebar-toggle');
 toggle.onclick=()=>{if(innerWidth<1024){state.drawerOpen=!app.classList.contains('drawer-open');app.classList.toggle('drawer-open',state.drawerOpen)}else{state.sidebarCollapsed=!app.classList.contains('collapsed');app.classList.toggle('collapsed',state.sidebarCollapsed)}};
 document.querySelector('.overlay').onclick=()=>{app.classList.remove('drawer-open');state.drawerOpen=false};
 document.querySelectorAll('[data-submenu]').forEach(button=>button.onclick=()=>{const menu=document.querySelector(`#${button.dataset.submenu}`),willOpen=!menu.classList.contains('open');document.querySelectorAll('.submenu').forEach(x=>x.classList.remove('open'));document.querySelectorAll('[data-submenu]').forEach(x=>x.setAttribute('aria-expanded','false'));menu.classList.toggle('open',willOpen);button.setAttribute('aria-expanded',String(willOpen))});
 document.querySelector('#register-btn').onclick=()=>document.querySelector('#register-modal').hidden=false;
 document.querySelectorAll('[data-close-modal]').forEach(button=>button.onclick=()=>button.closest('.modal').hidden=true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){document.querySelectorAll('.modal').forEach(modal=>modal.hidden=true);app.classList.remove('drawer-open')}});
}
