
(function(){
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  if(saved === 'light'){ root.classList.add('light'); }
  document.getElementById('themeToggle').addEventListener('click', ()=>{
    root.classList.toggle('light');
    localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
  });
})();

const $ = s => document.querySelector(s);
const pad = () => $('#pad').value;

function transformText(src){
  let s = src;

  const ops = {
    rmspaces: $('#opt-rmspaces').checked,
    rmbreaks: $('#opt-rmbreaks').checked,
    dedupe: $('#opt-dedupe').checked,
    trimLines: $('#opt-trimlines').checked,
    upper: $('#opt-upper').checked,
    lower: $('#opt-lower').checked,
    title: $('#opt-title').checked,
    reverse: $('#opt-reverse').checked
  };

  if(ops.trimLines){
    s = s.split(/\r?\n/).map(l => l.trimEnd()).join('\n');
  }
  if(ops.rmspaces){
    s = s.replace(/[\t ]+/g,' ').replace(/ *\n */g,'\n').trim();
  }
  if(ops.rmbreaks){
    s = s.replace(/\n+/g,' ');
  }
  if(ops.dedupe){
    const lines = s.split(/\r?\n/);
    const seen = new Set(); const kept = [];
    for(const l of lines){ if(!seen.has(l)){ seen.add(l); kept.push(l);} }
    s = kept.join('\n');
  }
  // Case transforms: if multiple are checked, apply in this priority order:
  if(ops.upper){ s = s.toUpperCase(); }
  else if(ops.lower){ s = s.toLowerCase(); }
  else if(ops.title){ s = s.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase()); }

  if(ops.reverse){ s = s.split('').reverse().join(''); }

  return s;
}

function analyze(s){
  const chars = s.length;
  const words = s.trim()? s.trim().split(/\s+/).length : 0;
  const sentences = (s.match(/[^.!?]+[.!?]+\s*/g) || (s.trim()? [s]: [])).length || 0;
  const paragraphs = s.split(/\n{2,}/).filter(p => p.trim().length>0).length || (s.trim()?1:0);
  return {chars, words, sentences, paragraphs};
}

function grammarHints(s){
  if(!$('#opt-grammar').checked) return [];
  const issues = [];
  if(/\s{2,}/.test(s)) issues.push({t:'Spacing', m:'Multiple consecutive spaces found.'});
  const arr = s.split(/(?<=[.!?])\s+/).filter(Boolean);
  arr.forEach((snip,i)=>{
    const first = snip.trim().charAt(0);
    if(first && /[a-z]/.test(first)) issues.push({t:'Capitalization', m:`Sentence ${i+1} may start lowercase.`});
  });
  if(/[!?]{3,}/.test(s)) issues.push({t:'Punctuation', m:'Excessive punctuation (e.g., !!! or ???).'});
  if(/\b(was|were|be|been|being|is|are|am)\s+\w+(ed|en)\b/i.test(s)) issues.push({t:'Style', m:'Possible passive voice.'});
  if(/\b(their|there|they\'re)\b/i.test(s)) issues.push({t:'Word Choice', m:'Check their/there/they’re usage.'});
  return issues;
}

function wordFreq(s){
  if(!$('#opt-frequency').checked) return [];
  const map = new Map();
  const tokens = (s.toLowerCase().match(/[\p{L}\p{N}\-']+/gu) || []);
  tokens.forEach(t => map.set(t, (map.get(t)||0) + 1));
  return Array.from(map.entries()).sort((a,b)=> b[1]-a[1]);
}

function render(){
  const src = pad();
  const transformed = transformText(src);
  $('#output').textContent = transformed;

  const k = analyze(transformed);
  $('#kpis').innerHTML = '';
  for(const [key,val] of Object.entries({Characters:k.chars, Words:k.words, Sentences:k.sentences, Paragraphs:k.paragraphs})){
    const span = document.createElement('span');
    span.className = 'kpi';
    span.textContent = key + ': ' + val;
    $('#kpis').appendChild(span);
  }

  // Grammar
  const hints = grammarHints(transformed);
  const g = $('#grammar');
  g.innerHTML = '';
  if($('#opt-grammar').checked){
    if(hints.length === 0){
      g.innerHTML = '<div>✅ No obvious issues found by the basic checks.</div>';
    }else{
      const ul = document.createElement('ul');
      hints.forEach(h => {
        const li = document.createElement('li'); li.textContent = `[${h.t}] ${h.m}`; ul.appendChild(li);
      });
      g.appendChild(ul);
    }
  }

  // Frequency
  const freq = wordFreq(transformed);
  const f = $('#frequency');
  f.innerHTML = '';
  if($('#opt-frequency').checked){
    const table = document.createElement('table'); table.className='table';
    table.innerHTML = '<thead><tr><th>Word</th><th>Count</th></tr></thead>';
    const tb = document.createElement('tbody');
    freq.forEach(([w,c])=>{
      const tr = document.createElement('tr'); tr.innerHTML = `<td>${w}</td><td>${c}</td>`; tb.appendChild(tr);
    });
    table.appendChild(tb);
    f.appendChild(table);
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.addEventListener('change', render));
  $('#pad').addEventListener('input', render);
  $('#copyBtn').addEventListener('click', ()=>{
    const t = $('#output').textContent;
    navigator.clipboard.writeText(t).then(()=>{
      const btn = $('#copyBtn'); const old = btn.textContent; btn.textContent = 'Copied!';
      setTimeout(()=> btn.textContent = old, 900);
    });
  });
  render();
});
