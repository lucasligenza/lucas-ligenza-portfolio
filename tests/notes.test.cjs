const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {readNote,renderNotes,markdown}=require('../scripts/engineering-notes.cjs');
const note=(title,status='published',date='2026-09-28')=>`---\ntitle: ${title}\ndate: ${date}\nstatus: ${status}\n---\n\n# Observation\n\nA real note about \`code\`.\n`;
test('draft and unmarked Markdown never become published articles',()=>{
 assert.equal(readNote(note('Private','draft'),'private.md'),null);assert.equal(readNote('# Just a draft','private.md'),null);
 assert.equal(readNote(note('Still private','draft','YYYY-MM-DD'),'private.md'),null);
});
test('published notes require complete valid metadata and render accessible headings',()=>{
 const parsed=readNote(note('A question'),'a-question.md');assert.equal(parsed.title,'A question');assert.match(parsed.html,/<h5>Observation<\/h5>/);assert.match(parsed.html,/<code>code<\/code>/);
 assert.throws(()=>readNote(note('Bad date','published','2026-02-30'),'bad.md'),/valid/);
 assert.throws(()=>readNote(note(''),'bad.md'),/title/);
 assert.throws(()=>readNote(note('Name'),'Bad Name.md'),/filename/);
});
test('Markdown escapes raw HTML and permits only HTTP(S) links',()=>{
 const html=markdown('<script>alert(1)</script>\n\n[unsafe](javascript:alert) [docs](https://example.com/?a=1&b=2)\n\n```js\nconst tag = "<img>";\n```');
 assert(!html.includes('<script>'));assert(!html.includes('<img>'));assert(!html.includes('href="javascript:'));
 assert.match(html,/href="https:\/\/example.com\/\?a=1&amp;b=2"/);assert.match(html,/&lt;img&gt;/);
 assert.throws(()=>markdown('```\nunfinished'),/Unclosed/);
});
test('empty logbook stays honest; published notes sort newest first and exclude templates',()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-notes-'));
 try{
  fs.writeFileSync(path.join(folder,'_template.md'),note('Never publish template'));
  fs.writeFileSync(path.join(folder,'draft.md'),note('Hidden draft','draft'));
  assert.match(renderNotes(folder),/No transmissions yet/);
  fs.writeFileSync(path.join(folder,'older.md'),note('Older','published','2026-09-01'));
  fs.writeFileSync(path.join(folder,'newer.md'),note('<Newest>'));
  const html=renderNotes(folder);assert(html.indexOf('&lt;Newest&gt;')<html.indexOf('Older'));assert(!html.includes('Hidden draft'));assert(!html.includes('Never publish template'));assert.match(html,/<time datetime="2026-09-28">/);assert.match(html,/<article /);assert(!html.includes('<details'));
 }finally{for(const file of fs.readdirSync(folder))fs.unlinkSync(path.join(folder,file));fs.rmdirSync(folder);}
});
