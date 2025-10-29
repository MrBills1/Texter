
(function(){
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  if(saved === 'light'){ root.classList.add('light'); }
  const btn = document.getElementById('themeToggle');
  if(btn){
    btn.addEventListener('click', () => {
      root.classList.toggle('light');
      localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
    });
  }
})();

(function(){
  const input = document.getElementById('toolSearch');
  if(!input) return;
  const cards = Array.from(document.querySelectorAll('[data-tool-card]'));
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    cards.forEach(c => {
      const text = (c.dataset.keywords || '').toLowerCase();
      c.style.display = text.includes(q) ? '' : 'none';
    });
  });
})();
