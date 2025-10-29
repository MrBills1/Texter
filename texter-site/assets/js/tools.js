
const el = sel => document.querySelector(sel);
const out = content => { const o = el('#output'); if(o) { o.innerHTML = ''; o.appendChild(content); } };
const text = () => (el('#input')?.value ?? '');

document.addEventListener('DOMContentLoaded', () => {
  const t = document.body?.dataset?.tool;
  const ta = el('#input');
  if(!t) return;
  const run = () => runTool(t);
  if(ta) ta.addEventListener('input', run);
  document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(cb => cb.addEventListener('change', run));
  run();
});

function setKPIs(map){
  const wrap = el('#kpis');
  if(!wrap) return;
  wrap.innerHTML = '';
  Object.entries(map).forEach(([k,v]) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = `${k}: ${v}`;
    wrap.appendChild(chip);
  });
}

function runTool(t){
  const s0 = text();
  if(t === 'counter'){ return runCounter(s0); }
  if(t === 'grammar-checker'){ return runGrammar(s0); }
  if(t === 'word-frequency'){ return runFrequency(s0); }
  const pre = document.createElement('pre'); pre.textContent = s0;
  out(pre);
}

function runCounter(s0){
  let s = s0;
  const rmSpaces = el('#opt-rmspaces')?.checked;
  const rmBreaks = el('#opt-rmbreaks')?.checked;
  const dedupe = el('#opt-dedupe')?.checked;
  const toUpper = el('#opt-upper')?.checked;
  const toLower = el('#opt-lower')?.checked;
  const toTitle = el('#opt-title')?.checked;
  const reverse = el('#opt-reverse')?.checked;

  if(rmSpaces){ s = s.replace(/[\t ]+/g,' ').replace(/ *\n */g,'\n').trim(); }
  if(rmBreaks){ s = s.replace(/\n+/g,' '); }
  if(dedupe){
    const lines = s.split(/\r?\n/);
    const seen = new Set(); const kept = [];
    lines.forEach(l => { if(!seen.has(l)){ seen.add(l); kept.push(l);} });
    s = kept.join('\n');
  }
  if(toUpper){ s = s.toUpperCase(); }
  else if(toLower){ s = s.toLowerCase(); }
  else if(toTitle){ s = s.replace(/\w\S*/g, (w)=> w[0].toUpperCase() + w.slice(1).toLowerCase()); }
  if(reverse){ s = s.split('').reverse().join(''); }

  const chars = s.length;
  const words = s.trim()? s.trim().split(/\s+/).length : 0;
  const sentences = (s.match(/[^.!?]+[.!?]+\s*/g) || (s.trim()? [s]: [])).length || 0;
  const paragraphs = s.split(/\n{2,}/).filter(p => p.trim().length>0).length || (s.trim()?1:0);
  setKPIs({Characters: chars, Words: words, Sentences: sentences, Paragraphs: paragraphs});

  const pre = document.createElement('pre'); pre.textContent = s;
  out(pre);
}

function runGrammar(s){
  const issues = [];
  if(/\s{2,}/.test(s)) issues.push({type:'Spacing', msg:'Multiple consecutive spaces found.'});
  const sentences = s.split(/(?<=[.!?])\s+/).filter(Boolean);
  sentences.forEach((snip, i) => {
    const first = snip.trim().charAt(0);
    if(first && /[a-z]/.test(first)) issues.push({type:'Capitalization', msg:`Sentence ${i+1} may start with a lowercase letter.`});
  });
  if(/[!?]{3,}/.test(s)) issues.push({type:'Punctuation', msg:'Excessive punctuation (e.g., !!! or ???).'});
  if(/\b(was|were|be|been|being|is|are|am)\s+\w+(ed|en)\b/i.test(s)) issues.push({type:'Style', msg:'Possible passive voice detected.'});
  if(/\b(their|there|they\'re)\b/i.test(s)) issues.push({type:'Word Choice', msg:'Check usage of their/there/they’re.'});

  const box = document.createElement('div');
  if(!s.trim()){
    box.innerHTML = '<div class="small">Type text to see suggestions.</div>';
  } else if(issues.length === 0){
    box.innerHTML = '<div>✅ No obvious issues found by the basic checks.</div>';
  } else {
    const ul = document.createElement('ul');
    issues.forEach(it => {
      const li = document.createElement('li');
      li.textContent = `[${it.type}] ${it.msg}`;
      ul.appendChild(li);
    });
    box.appendChild(ul);
  }
  setKPIs({Characters: s.length, Words: s.trim()? s.trim().split(/\s+/).length : 0, "Suggestions": (issues||[]).length});
  out(box);
}

function runFrequency(s){
  const map = new Map();
  const tokens = (s.toLowerCase().match(/[\p{L}\p{N}\-']+/gu) || []);
  tokens.forEach(t => map.set(t, (map.get(t)||0)+1));
  const rows = Array.from(map.entries()).sort((a,b)=> b[1]-a[1]);

  const table = document.createElement('table'); table.className='table';
  const thead = document.createElement('thead'); thead.innerHTML = '<tr><th>Word</th><th>Count</th></tr>'; table.appendChild(thead);
  const tb = document.createElement('tbody');
  rows.forEach(([w,c]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${w}</td><td>${c}</td>`;
    tb.appendChild(tr);
  });
  table.appendChild(tb);
  setKPIs({Unique: map.size, Tokens: tokens.length});
  out(table);
}
