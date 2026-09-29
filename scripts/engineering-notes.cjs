const fs=require('node:fs'),path=require('node:path');
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// A deliberately small Markdown subset, rendered at build time with no raw HTML.
function inline(text){
 const tokens=/`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;let html='',end=0;
 for(const match of text.matchAll(tokens)){
  html+=escape(text.slice(end,match.index));
  html+=match[1]?'<code>'+escape(match[1])+'</code>':match[2]?'<strong>'+escape(match[2])+'</strong>':'<a href="'+escape(match[4])+'">'+escape(match[3])+'</a>';
  end=match.index+match[0].length;
 }return html+escape(text.slice(end));
}
function markdown(source){
 const lines=source.trim().split(/\r?\n/),html=[];let paragraph=[],list=[],code=null;
 const flush=()=>{if(paragraph.length){html.push('<p>'+inline(paragraph.join(' '))+'</p>');paragraph=[];}if(list.length){html.push('<ul>'+list.map(item=>'<li>'+inline(item)+'</li>').join('')+'</ul>');list=[];}};
 for(const line of lines){
  if(/^```/.test(line)){flush();if(code){html.push('<pre><code>'+escape(code.join('\n'))+'</code></pre>');code=null;}else code=[];continue;}
  if(code){code.push(line);continue;}
  const heading=line.match(/^(#{1,3})\s+(.+)$/),item=line.match(/^[-*]\s+(.+)$/);
  if(heading){flush();const level=Math.min(6,heading[1].length+4);html.push('<h'+level+'>'+inline(heading[2])+'</h'+level+'>');}
  else if(item){if(paragraph.length)flush();list.push(item[1]);}
  else if(!line.trim())flush();
  else{if(list.length)flush();paragraph.push(line.trim());}
 }
 if(code)throw Error('Unclosed Markdown code fence');flush();return html.join('\n');
}
function readNote(source,file){
 const parts=source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);if(!parts)return null;
 const meta=Object.fromEntries(parts[1].split(/\r?\n/).filter(line=>/^\w+:/.test(line)).map(line=>{const colon=line.indexOf(':');return [line.slice(0,colon),line.slice(colon+1).trim().replace(/^(['"])(.*)\1$/,'$2')];}));
 if(meta.status!=='published')return null;
 const date=/^\d{4}-\d{2}-\d{2}$/.test(meta.date||'')?new Date(meta.date+'T00:00:00Z'):null;
 if(!meta.title||!date||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==meta.date||!parts[2].trim())throw Error(file+': published notes need title, a valid YYYY-MM-DD date, and a body.');
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(file))throw Error(file+': use a lowercase-hyphenated Markdown filename.');
 return {title:meta.title,date:meta.date,slug:file.slice(0,-3),html:markdown(parts[2])};
}
function renderNotes(directory){
 const notes=fs.readdirSync(directory).filter(file=>file.endsWith('.md')&&!file.startsWith('_')&&file!=='README.md').map(file=>readNote(fs.readFileSync(path.join(directory,file),'utf8'),file)).filter(Boolean).sort((a,b)=>b.date.localeCompare(a.date)||a.slug.localeCompare(b.slug));
 if(!notes.length)return '<p class="notes-empty">No transmissions yet. This logbook is waiting for its first entry.</p><p class="notes-topics">On the radar: reliable agents, open-weight models, AI infrastructure, and lessons from building.</p>';
 return notes.map(note=>'<article class="engineering-detail engineering-note"><header><h4>'+escape(note.title)+'</h4><time datetime="'+note.date+'">'+note.date+'</time></header><div class="detail-body markdown-note">'+note.html+'</div></article>').join('\n')+'<p class="personal-note">Personal observations, not official IBM positions.</p>';
}
module.exports={renderNotes,readNote,markdown};
