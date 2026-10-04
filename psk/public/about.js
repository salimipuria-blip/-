const mobileMenu=document.getElementById('mobileMenu'),mobileNav=document.getElementById('mobileNav');
mobileMenu.addEventListener('click',()=>{const next=!mobileNav.classList.contains('open');mobileNav.classList.toggle('open',next);mobileMenu.setAttribute('aria-expanded',String(next))});
mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobileNav.classList.remove('open');mobileMenu.setAttribute('aria-expanded','false')}));
