/* Small things to find between the big things. Every moving mark is a character. */
const JourneyDiscoveries = (() => {
  'use strict';
  const storageKey = 'lucas-galaxy-discoveries-v1';
  const slash = String.fromCharCode(92);
  const entries = [
    { name: 'An unlisted visitor', place: 'EARTH / UNIDENTIFIED', color: '#aec9ae', label: 'Inspect the tiny unidentified spacecraft', glyph: ['   .--.   ', ' _/ oo '+slash+'_ ', '(________)', '  .    .  '] },
    { name: 'One small detour', place: 'MOON / TRANQUILITY', color: '#c4c8d1', label: 'Inspect the lunar landing flag', glyph: ['   |==> ', '   |    ', ' _.|._  ', "'  :  '"] },
    { name: 'A very curious rover', place: 'MARS / SURFACE SIGNAL', color: '#d4a184', label: 'Inspect the little Mars rover', glyph: ['   _|_   ', ' _[o=]__ ', '(_)=(_)= ', ' . : . . '] },
    { name: 'A pocket solar system', place: 'RINGS / ORBITAL ANOMALY', color: '#c8b28d', label: 'Inspect the orbiting moonlets', glyph: ['  . * .  ', ' ( (@) ) ', '  * . *  ', '   ...   '] },
    { name: 'Someone left a record', place: 'BEYOND / LONG-RANGE SIGNAL', color: '#c5b574', label: 'Inspect the distant golden record', glyph: ['  .----.  ', ' / ((o))'+slash+' ', ' '+slash+' /|/ / ', "  '----'  "] }
  ];
  let root, beacon, foundButton, shade, panel, art, message, controls, progress, closeButton;
  let found = new Set(), active = 0, modal = null, opener = null, phase = 'arrival';
  let clock = 0, paused = false, reduced = false, flying = false, lastPaint = -1;
  let animation = null, visits = [0,0,0,0,0], footprints = 0, samples = 0, orbits = [1,2,3], decoded = false;
  let scrollLock = null;
  const monoWidth = 42, blank = () => Array.from({length: 13}, () => Array(monoWidth).fill(' '));
  function place(grid, lines, x, y) {
    lines.forEach((line, row) => [...line].forEach((char, col) => {
      if (grid[y + row] && x + col >= 0 && x + col < monoWidth) grid[y + row][x + col] = char;
    }));
  }
  function picture(grid) { return grid.map(row => row.join('')).join('\n'); }
  function node(tag, className, content) {
    const element = document.createElement(tag);
    if(className) element.className = className;
    if(content !== undefined) element.textContent = content;
    return element;
  }
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify([...found])); } catch (_) { /* Discovery still works without storage. */ }
    foundButton.textContent = `[ * ] ${found.size}/5`;
    foundButton.setAttribute('aria-label', `Open discovery log, ${found.size} of 5 found`);
  }
  function setMessage(text) { if(message.textContent !== text) message.textContent = text; }
  function action(label, run) {
    const button = node('button', 'discovery-action', label);
    button.type = 'button'; button.addEventListener('click', run); controls.append(button); return button;
  }
  function start(kind, duration) {
    animation = { kind, start: clock, duration };
    lastPaint = -1;
    if(reduced) { animation.start -= duration; render(); }
    else render();
  }
  function lockJourney() {
    if(scrollLock) return;
    const body = document.body, html = document.documentElement;
    const styles = [];
    function remember(element, properties) {
      properties.forEach(property => styles.push({element, property, value: element.style.getPropertyValue(property), priority: element.style.getPropertyPriority(property)}));
    }
    remember(body, ['position', 'top', 'left', 'right', 'width', 'overflow', 'padding-right']);
    remember(html, ['overflow', 'scroll-behavior']);
    const inert = [...body.children].filter(element => element !== root && !['SCRIPT', 'STYLE'].includes(element.tagName)).concat(beacon, foundButton).map(element => ({element, value: element.inert}));
    scrollLock = {x: window.scrollX, y: window.scrollY, styles, inert};
    // The camera must keep its document position while fixed-body locking temporarily resets scrollY.
    window.dispatchEvent(new CustomEvent('journey:modal', {detail: {open: true, scrollX: scrollLock.x, scrollY: scrollLock.y}}));
    const scrollbar = Math.max(0, window.innerWidth - html.clientWidth);
    const padding = parseFloat(getComputedStyle(body).paddingRight) || 0;
    inert.forEach(({element}) => { element.inert = true; });
    html.style.overflow = 'hidden'; html.style.scrollBehavior = 'auto';
    body.style.position = 'fixed'; body.style.top = `${-scrollLock.y}px`; body.style.left = `${-scrollLock.x}px`; body.style.right = '0';
    body.style.width = '100%'; body.style.overflow = 'hidden';
    if(scrollbar) body.style.paddingRight = `${padding + scrollbar}px`;
  }
  function unlockJourney() {
    if(!scrollLock) return;
    const saved = scrollLock; scrollLock = null;
    saved.styles.forEach(({element, property, value, priority}) => {
      if(value) element.style.setProperty(property, value, priority);
      else element.style.removeProperty(property);
    });
    saved.inert.forEach(({element, value}) => { element.inert = value; });
    // Explicit instant restoration overrides any smooth scrolling on the page.
    window.scrollTo({left: saved.x, top: saved.y, behavior: 'instant'});
    window.dispatchEvent(new CustomEvent('journey:modal', {detail: {open: false, scrollX: window.scrollX, scrollY: window.scrollY}}));
  }
  function close(restore = true) {
    if(modal === null) return;
    shade.hidden = true; modal = null; animation = null;
    unlockJourney();
    if(restore && opener && !opener.hidden) opener.focus({preventScroll: true});
  }
  function shell(title, subtitle) {
    if(!scrollLock) opener = document.activeElement;
    shade.hidden = false;
    lockJourney();
    panel.scrollTop = 0;
    panel.querySelector('.discovery-title').textContent = title;
    panel.querySelector('.discovery-coordinate').textContent = subtitle;
    controls.replaceChildren(); art.textContent = ''; message.textContent = ''; progress.textContent = '';
    art.hidden = false; message.hidden = false; progress.hidden = true;
    closeButton.focus({preventScroll: true});
  }
  function open(index) {
    if(flying) return;
    active = index; modal = index; visits[index]++; animation = null;
    found.add(index); persist();
    shell(entries[index].name, entries[index].place);
    panel.style.setProperty('--discovery-color', entries[index].color);
    if(index === 0) {
      setMessage('That is definitely not on the flight plan. Try saying hello.');
      action('Hail the visitor', () => { setMessage('Sending a very polite first-contact ping...'); start('visitor', 5); });
    } else if(index === 1) {
      setMessage('A quiet patch of the Moon. Make your mark.');
      action('Leave a footprint', () => { footprints = Math.min(footprints + 1, 8); setMessage(footprints >= 3 ? 'Somewhere, a future explorer is wondering who took the scenic route.' : `${footprints} small ${footprints === 1 ? 'step' : 'steps'}. Plenty of room for more.`); start('footprint', 1.2); });
      action('Plant a flag', () => { setMessage('LUCAS WAS HERE. So were you.'); start('flag', 2.2); });
    } else if(index === 2) {
      setMessage('A rover with nowhere urgent to be. Give it something to explore.');
      action('Take the rover for a drive', () => { setMessage('Six wheels. One excellent detour.'); start('rover', 7); });
      action('Collect a sample', () => { samples++; setMessage(['Basalt. 3.7 billion years old. Still younger than that unfinished side project.', 'Iron-rich dust. The whole planet is wearing its rust.', 'A perfectly ordinary rock. Keeping it anyway.'][(samples - 1) % 3]); start('sample', 2.5); });
    } else if(index === 3) {
      setMessage('Three moonlets. One alignment. Nudge each marker to the top (+).');
      ['Inner', 'Middle', 'Outer'].forEach((label, i) => action(`Nudge ${label.toLowerCase()}`, () => {
        orbits[i] = (orbits[i] + 1) % 4;
        const aligned = orbits.every(value => value === 0);
        setMessage(aligned ? 'Resonance found. A tiny cosmic coincidence, just for you.' : `${orbits.filter(value => value === 0).length}/3 aligned. A little patience goes a long way out here.`);
        start(aligned ? 'resonance' : 'orbit', aligned ? 4 : .7);
      }));
    } else {
      setMessage(decoded ? 'A message from the edge of this little universe.' : 'A golden record drifting past the last familiar star. There is something etched into it.');
      action('Decode the record', () => { setMessage('Reading the grooves...'); start('record', 5); });
    }
    lastPaint = -1; render();
  }
  function openLog() {
    modal = 'log'; animation = null;
    shell('The things you found', 'PERSONAL / FLIGHT JOURNAL');
    panel.style.setProperty('--discovery-color', '#b0a47d');
    art.textContent = ['        .       *        .', '    *      .         *', '      [ YOUR SMALL UNIVERSE ]', '  .       *       .       *'].join('\n');
    message.textContent = found.size === 5 ? 'All five found. The best part of a journey is getting a little distracted.' : 'Look for small ASCII objects around each world. Some things reward a second look.';
    entries.forEach((entry, i) => {
      const row = node('div', 'discovery-log-row');
      row.append(node('span', '', found.has(i) ? '[*]' : '[ ]'), node('span', '', found.has(i) ? entry.name : ['An unexpected visitor', 'Something left on the Moon', 'A signal in the red dust', 'A coincidence in the rings', 'A message past the last star'][i]));
      controls.append(row);
    });
  }
  function render() {
    if(modal === null || modal === 'log') return;
    const grid = blank(), elapsed = animation ? Math.max(0, clock - animation.start) : 0;
    const p = animation ? Math.min(1, elapsed / animation.duration) : 0;
    const running = animation && p < 1;
    const moving = running && !reduced;
    const t = reduced ? 0 : clock;
    place(grid, ['.                  *', '       .                    .'], 3, 0);
    if(modal === 0) {
      const x = animation ? Math.round(3 + Math.sin(Math.PI * p) * 25) : 14;
      place(grid, ['   .----.   ', ' _/ o  o '+slash+'_ ', '(__________)', '    /  '+slash+'    '], x, 3);
      if(animation) {
        place(grid, [p < .55 ? '. : (( HELLO? )) : .' : '. : (( OH, HI. )) : .'], 10, 10);
        if(p > .5) place(grid, ['  '+(Math.floor(t * 4) % 2 && moving ? '*' : '+')+'  '], x + 10, 2);
        if(p === 1) setMessage('They waved back. Apparently we are the aliens out here.');
      }
    } else if(modal === 1) {
      place(grid, ["          _..._      _.._", "__..---''      '----'    '--..___", " .      o        .       .      "], 2, 9);
      for(let i = 0; i < footprints; i++) place(grid, [i % 2 ? " '" : '. '], 7 + i * 3, 10 + i % 2);
      const flag = animation && animation.kind === 'flag';
      const height = flag ? Math.round(4 * p) : 4;
      place(grid, ['|'+(flag ? 'LUCAS' : '==>')], 29, 8 - height);
      for(let y = 9 - height; y < 10; y++) place(grid, ['|'], 29, y);
      if(flag && p === 1) place(grid, ['YOU TOO ^'], 29, 11);
    } else if(modal === 2) {
      const x = animation?.kind === 'rover' ? Math.round(3 + 23 * p) : 14;
      const wheels = moving && Math.floor(t * 7) % 2 ? '@' : 'o';
      place(grid, ['       _|_', '   __[o=]___', `  (${wheels})=(${wheels})=(${wheels})`], x, 5);
      place(grid, ["___..____..___.._____..___..____..____", '  .      :     .    :       .   :', '     ^      .      o      ^      .'], 3, 9);
      if(animation?.kind === 'rover') place(grid, ['='.repeat(Math.max(0, x - 2))], 3, 9);
      if(animation?.kind === 'sample') place(grid, [p < 1 ? [' |',' :',' *'][Math.floor(t * 6) % 3] : ' [#]'], x + 10, 8);
      if(animation?.kind === 'rover' && p === 1) setMessage('New coordinates. Same insatiable curiosity.');
    } else if(modal === 3) {
      const cx = 21, cy = 6;
      for(let ring = 0; ring < 3; ring++) {
        const rx = 5 + ring * 5, ry = 2 + ring;
        for(let step = 0; step < 40; step++) {
          const angle = step / 40 * Math.PI * 2;
          place(grid, ['.'], Math.round(cx + Math.cos(angle) * rx), Math.round(cy + Math.sin(angle) * ry));
        }
        const angle = orbits[ring] * Math.PI / 2 - Math.PI / 2;
        place(grid, ['+'], cx, cy - ry);
        place(grid, [orbits[ring] === 0 ? '*' : '@'], Math.round(cx + Math.cos(angle) * rx), Math.round(cy + Math.sin(angle) * ry));
      }
      place(grid, ['(O)'], cx - 1, cy);
      if(animation?.kind === 'resonance') place(grid, [p < 1 && moving ? '. : * RESONANCE * : .' : '*  ORBITS IN HARMONY  *'], 10, 12);
    } else {
      place(grid, ["       .------------.", "    .-' .----------. '-.", `   /   / .------.   ${slash}  ${slash}`, `  |   | / .--.  ${slash}  |  |`, "  |   | | (o) |  |  |  |", `  |   | ${slash} '--' /  /   |`, `   ${slash}   ${slash} '----'  /   /`, "    '-. '------' .-'", "       '--------'"], 8, 2);
      if(animation?.kind === 'record') {
        const words = 'STAY CURIOUS. KEEP MAKING THINGS.';
        place(grid, [words.slice(0, Math.ceil(p * words.length)).padEnd(words.length, '.')], 5, 12);
        if(p === 1) { decoded = true; setMessage('Stay curious. Keep making things. A message from Lucas, to whoever finds this.'); }
      }
    }
    const text = picture(grid);
    if(art.textContent !== text) art.textContent = text;
    if(animation) {
      progress.hidden = false;
      progress.textContent = '[' + '='.repeat(Math.round(p * 20)).padEnd(20, '.') + '] ' + (paused && p < 1 ? 'PAUSED' : p === 1 ? 'COMPLETE' : 'SIGNAL ACTIVE');
    }
  }
  function init() {
    if(root) return;
    try { const data = JSON.parse(localStorage.getItem(storageKey) || '[]'); if(Array.isArray(data)) found = new Set(data.filter(index => Number.isInteger(index) && index >= 0 && index < 5)); } catch (_) { /* Optional local log. */ }
    root = node('div', 'journey-discoveries'); root.setAttribute('data-journey-interactive', '');
    beacon = node('button', 'discovery-beacon'); beacon.type = 'button'; beacon.append(node('pre', 'discovery-beacon-art'), node('span', 'discovery-beacon-caption', '[ investigate ]'));
    beacon.querySelector('pre').setAttribute('aria-hidden', 'true');
    beacon.addEventListener('click', () => open(active));
    foundButton = node('button', 'discovery-log'); foundButton.type = 'button'; foundButton.addEventListener('click', openLog);
    shade = node('div', 'discovery-shade'); shade.hidden = true;
    panel = node('section', 'discovery-panel'); panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'discovery-title'); panel.setAttribute('data-journey-interactive', '');
    const header = node('div', 'discovery-heading'), headingText = node('div');
    const coordinate = node('p', 'discovery-coordinate'); const title = node('h2', 'discovery-title'); title.id = 'discovery-title';
    headingText.append(coordinate, title); closeButton = node('button', 'discovery-close', '[ x ]'); closeButton.type = 'button'; closeButton.setAttribute('aria-label', 'Close discovery'); closeButton.addEventListener('click', () => close()); header.append(headingText, closeButton);
    art = node('pre', 'discovery-art'); art.setAttribute('aria-hidden', 'true');
    progress = node('p', 'discovery-progress'); progress.setAttribute('aria-hidden', 'true');
    message = node('p', 'discovery-message'); message.setAttribute('aria-live', 'polite');
    controls = node('div', 'discovery-controls');
    panel.append(header, art, progress, message, controls); shade.append(panel);
    const tools = node('div', 'discovery-tools'); tools.setAttribute('role', 'group'); tools.setAttribute('aria-label', 'Discoveries');
    tools.append(foundButton, beacon); root.append(tools, shade); document.body.append(root);
    shade.addEventListener('click', event => { if(event.target === shade) close(); });
    // The panel retains native scrolling; gestures on its backdrop cannot move the journey.
    ['wheel', 'touchmove'].forEach(type => shade.addEventListener(type, event => {
      if(modal !== null && !panel.contains(event.target)) event.preventDefault();
    }, {passive: false}));
    root.addEventListener('keydown', event => {
      if(modal === null) return;
      event.stopPropagation();
      if(event.key === 'Escape') { event.preventDefault(); close(); }
      if(event.key === 'Tab') {
        const items = [...panel.querySelectorAll('button:not([disabled]),[href],input,textarea,[tabindex="0"]')];
        const first = items[0], last = items.at(-1);
        if(event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if(!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    persist(); refreshBeacon();
  }
  function refreshBeacon() {
    if(!root) return;
    const entry = entries[active];
    root.dataset.stop = active; beacon.style.setProperty('--discovery-color', entry.color);
    beacon.querySelector('pre').textContent = entry.glyph.join('\n');
    beacon.setAttribute('aria-label', entry.label + (found.has(active) ? ', previously discovered' : ''));
  }
  function update(state) {
    if(!root) return;
    clock = state.time; paused = state.paused;
    if(state.reduced && !reduced && animation) animation.start = clock - animation.duration;
    reduced = state.reduced; phase = state.phase;
    flying = state.isFlying;
    if(flying && modal !== null) close(false);
    const next = Math.max(0, Math.min(4, state.active));
    if(next !== active) { active = next; refreshBeacon(); }
    beacon.hidden = flying; foundButton.hidden = flying;
    if(modal !== null && (animation || lastPaint < 0) && (Math.abs(clock - lastPaint) > .07 || reduced || paused || lastPaint < 0)) { render(); lastPaint = clock; }
  }
  return { init, update, hasModal: () => modal !== null };
})();
