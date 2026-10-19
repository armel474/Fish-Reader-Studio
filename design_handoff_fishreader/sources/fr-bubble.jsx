const HOSTS = {
  article: { app: 'Journal régional', url: 'journal-regional.ca/traversier', kicker: 'Actualités régionales', title: 'Le traversier reprend ses départs réguliers', meta: `Publié aujourd’hui à 6${NBS}h${NBS}30`, paragraphs: [
    ['Le traversier entre Sorel-Tracy et Saint-Ignace-de-Loyola reprendra ses départs réguliers lundi matin.', 'Les travaux sur le quai ont été terminés avec une semaine d’avance.'],
    [`Le service rappelle que les départs de 6${NBS}h${NBS}15 sont souvent complets.`, 'Les usagers sont invités à réserver leur place en ligne la veille.', 'Les cyclistes pourront embarquer sans réservation.'],
    ['Un horaire réduit restera en vigueur les jours fériés jusqu’à la fin de l’automne.', 'La traversée dure environ dix minutes.'],
    ['La municipalité étudie aussi l’ajout d’un abri chauffé pour les piétons.', 'Une consultation publique aura lieu à l’hôtel de ville le 12 novembre.'],
  ] },
  mail: { app: 'Courriel', url: 'Boîte de réception', kicker: 'Clinique Saint-Roch', title: 'Confirmation de votre rendez-vous', meta: `De : accueil@clinique-stroch.ca · 8${NBS}h${NBS}05`, paragraphs: [
    ['Bonjour Armel,', `Votre rendez-vous est confirmé pour le jeudi 23 octobre à 14${NBS}h${NBS}30.`],
    ['Présentez-vous à l’accueil dix minutes avant l’heure prévue.', 'Apportez votre carte d’assurance maladie et la liste de vos médicaments.'],
    ['Si vous devez annuler, appelez-nous au moins vingt-quatre heures à l’avance.', 'Le stationnement est gratuit derrière la clinique.'],
    ['Au plaisir de vous voir,', 'L’équipe de la Clinique Saint-Roch'],
  ] },
};

function LiveWave({ playing }) {
  return <span className={'b-wave' + (playing ? ' is-on' : '')} aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <i key={i} style={{ animationDelay: i * 0.12 + 's' }}></i>)}</span>;
}

function HostApp({ host, active, read, pick, scanning, onPick, scrollRef }) {
  let idx = 0;
  const sent = s => { const i = idx++; return <React.Fragment key={i}><span data-i={i} className={'b-sent' + (i === active ? ' is-active' : i < read ? ' is-read' : '')} onClick={pick ? () => onPick(i) : undefined}>{s}</span>{' '}</React.Fragment>; };
  return <div className={'b-host' + (pick ? ' is-pick' : '') + (scanning ? ' is-scan' : '')}>
    <div className="b-host-bar"><span className="b-host-app">{host.app}</span><span className="b-host-url">{host.url}</span></div>
    <div className="b-host-scroll" ref={scrollRef}>
      <p className="b-host-kicker">{host.kicker}</p>
      <h2 className="b-host-title b-block">{sent(host.title)}</h2>
      <p className="b-host-meta">{host.meta}</p>
      {host.paragraphs.map((p, pi) => <p key={pi} className="b-host-p b-block">{p.map(sent)}</p>)}
    </div>
    {scanning ? <div className="b-scanline" aria-hidden="true"></div> : null}
  </div>;
}

const STOP_SVG = <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"></rect></svg>;
const SKIP_LIMITS = { sec: [5, 120, 5], sent: [1, 10, 1] };

function useSkipPrefs() {
  const [p, setP] = React.useState(() => { try { return { unit: 'sec', sec: 15, sent: 1, ...JSON.parse(localStorage.getItem('frb-skip') || '{}') }; } catch (e) { return { unit: 'sec', sec: 15, sent: 1 }; } });
  const set = patch => setP(o => { const n = { ...o, ...patch }; localStorage.setItem('frb-skip', JSON.stringify(n)); return n; });
  return [p, set];
}
const skipLabel = (p, sign) => p.unit === 'sec' ? `${sign}${p.sec}${NBS}s` : `${sign}${p.sent}${NBS}phr.`;
const skipAria = (p, fwd) => (fwd ? 'Avancer de ' : 'Reculer de ') + (p.unit === 'sec' ? `${p.sec} secondes` : `${p.sent} phrase${p.sent > 1 ? 's' : ''}`);

function SkipButton({ prefs, fwd, onClick }) {
  const { Icon } = FRDS;
  return <button type="button" className="b-skip" aria-label={skipAria(prefs, fwd)} onClick={onClick}>
    <Icon name={fwd ? 'forward' : 'rewind'} size={22} /><span className="b-tab">{skipLabel(prefs, fwd ? '+' : '−')}</span>
  </button>;
}

function Stepper({ value, min, max, step, unit, onChange, label }) {
  const { Icon } = FRDS;
  const minus = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14"></path></svg>;
  return <div className="b-stepper" role="group" aria-label={label}>
    <button type="button" className="b-stepbtn" aria-label="Diminuer" disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>{minus}</button>
    <span className="b-stepper-val b-tab" aria-live="polite">{value}<small>{unit}</small></span>
    <button type="button" className="b-stepbtn" aria-label="Augmenter" disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}><Icon name="plus" size={20} /></button>
  </div>;
}

function SkipSettings({ prefs, setPrefs }) {
  const { Segmented, Chip } = FRDS;
  const isSec = prefs.unit === 'sec';
  const [min, max, step] = SKIP_LIMITS[prefs.unit];
  const val = isSec ? prefs.sec : prefs.sent;
  const setVal = v => setPrefs(isSec ? { sec: v } : { sent: v });
  const presets = isSec ? [5, 10, 15, 30] : [1, 2, 3, 5];
  return <div className="b-skipset">
    <div className="m-lbl"><span>Avancer et reculer de</span></div>
    <div className="b-seg2"><Segmented label="Unité du saut" value={prefs.unit} onChange={u => setPrefs({ unit: u })} options={[{ value: 'sec', label: 'Secondes' }, { value: 'sent', label: 'Phrases' }]} /></div>
    <Stepper value={val} min={min} max={max} step={step} unit={isSec ? `${NBS}s` : (val > 1 ? `${NBS}phrases` : `${NBS}phrase`)} onChange={setVal} label="Durée du saut" />
    <div className="b-presets">{presets.map(n => <Chip key={n} selected={val === n} onClick={() => setVal(n)}>{isSec ? `${n}${NBS}s` : `${n}`}</Chip>)}</div>
  </div>;
}

function BubblePlayer({ pb, v, total, speed, setSpeed, onReduce, onPick, onStop }) {
  const { Button, Icon } = FRDS;
  const [prefs, setPrefs] = useSkipPrefs();
  const [showSet, setShowSet] = React.useState(false);
  const skip = fwd => prefs.unit === 'sec' ? pb.skipSec(fwd ? prefs.sec : -prefs.sec) : pb.skipSent(fwd ? prefs.sent : -prefs.sent);
  const cycle = () => { const n = SPEEDS.find(s => s > speed + 0.001); setSpeed(n || SPEEDS[0]); };
  return <div className="b-player" role="region" aria-label="Lecteur Fish Reader">
    <div className="m-mini-head">
      <span className="fr-avatar" aria-hidden="true">{v.name[0]}</span>
      <div className="m-mini-txt"><p className="fr-player-name">{pb.playing ? `${v.name} lit cet écran` : 'Lecture en pause'}</p><p className="fr-player-sub b-tab">{`Phrase ${pb.active + 1} sur ${total}`}</p></div>
      <Button variant="ghost" onClick={onReduce}>Réduire</Button>
    </div>
    <div className="m-line"><span style={{ width: pb.progress + '%' }}></span></div>
    <div className="b-times b-tab"><span>{fmtTime(pb.elapsed)}</span><span>{fmtTime(pb.duration)}</span></div>
    <div className="b-transport">
      <SkipButton prefs={prefs} onClick={() => skip(false)} />
      <button type="button" className="fr-play b-play-lg" aria-label={pb.playing ? 'Pause' : 'Reprendre'} onClick={pb.toggle}><Icon name={pb.playing ? 'pause' : 'play'} size={26} /></button>
      <SkipButton prefs={prefs} fwd onClick={() => skip(true)} />
    </div>
    <div className="b-player-row">
      <button type="button" className="m-speed" aria-label={'Vitesse ' + fmtSpeed(speed) + ', toucher pour changer'} onClick={cycle}>{fmtSpeed(speed)}</button>
      <button type="button" className="b-setbtn" aria-expanded={showSet} onClick={() => setShowSet(s => !s)}><span>Sauts</span><b className="b-tab">{skipLabel(prefs, '±')}</b></button>
      <button type="button" className="b-stop" onClick={onStop}>{STOP_SVG}<span>Arrêter</span></button>
    </div>
    {showSet ? <SkipSettings prefs={prefs} setPrefs={setPrefs} /> : null}
    <Button variant="ghost" size="lg" icon="bookmark" className="m-full" onClick={onPick}>Choisir un autre endroit</Button>
  </div>;
}

function MenuSheet({ speed, setSpeed, voice, setVoice, follow, setFollow, onRead, onPick, onHide, onClose }) {
  const { Button, IconButton, Segmented, Chip, Badge } = FRDS;
  return <>
    <button type="button" className="b-outside" aria-label="Fermer le menu" onClick={onClose}></button>
    <div className="b-sheet" role="dialog" aria-label="Menu de lecture">
      <div className="b-sheet-head">
        <span className="b-wordmark">Fish Reader</span>
        <Badge tone="neutral">{VOICES.find(v => v.id === voice).name} · {fmtSpeed(speed)}</Badge>
        <span className="b-grow"></span>
        <IconButton icon="close" size="lg" label="Fermer le menu" onClick={onClose} />
      </div>
      <div className="b-sheet-main">
        <Button variant="primary" size="lg" icon="play" className="m-full" onClick={onRead}>Lire cet écran</Button>
        <Button variant="secondary" size="lg" icon="bookmark" className="m-full" onClick={onPick}>Choisir où commencer</Button>
      </div>
      <div className="m-lbl"><span>Vitesse</span><span className="m-num">{fmtSpeed(speed)}</span></div>
      <div className="m-seg5"><Segmented label="Vitesse de lecture" value={speed} onChange={setSpeed} options={SPEEDS.map(s => ({ value: s, label: fmtSpeed(s) }))} /></div>
      <div className="m-lbl"><span>Voix</span></div>
      <div className="m-chips">{VOICES.map(v => <Chip key={v.id} selected={voice === v.id} onClick={() => setVoice(v.id)}>{v.name}</Chip>)}</div>
      <div className="b-sep"></div>
      <div className="m-quick-row">
        <div className="m-quick-txt"><p className="m-quick-title">Suivre la lecture</p><p className="m-caption">Fish Reader fait défiler l’écran au rythme de la voix.</p></div>
        <Switch checked={follow} onChange={setFollow} label="Suivre la lecture" />
      </div>
      <Button variant="ghost" size="lg" icon="close" className="m-full" onClick={onHide}>Masquer la bulle</Button>
    </div>
  </>;
}

function BubbleOverlay({ shape, hostId, autoTuck }) {
  const { Button, IconButton, Icon } = FRDS;
  const host = HOSTS[hostId];
  const sentences = React.useMemo(() => [host.title, ...host.paragraphs.flat()], [host]);
  const [speed, setSpeed] = React.useState(1.25);
  const [voice, setVoice] = React.useState('clara');
  const [follow, setFollow] = React.useState(true);
  const pb = usePlayback(sentences, speed);
  const [mode, setMode] = React.useState('idle');
  const [expanded, setExpanded] = React.useState(false);
  const [tucked, setTucked] = React.useState(false);
  const [side, setSide] = React.useState('right');
  const [yf, setYf] = React.useState(0.55);
  const [drag, setDrag] = React.useState(null);
  const [overTrash, setOverTrash] = React.useState(false);
  const areaRef = React.useRef(null), scrollRef = React.useRef(null), st = React.useRef(null), started = React.useRef(false);
  const v = VOICES.find(x => x.id === voice);

  React.useEffect(() => { pb.load(-1, false); setMode('idle'); setExpanded(false); started.current = false; }, [hostId]);
  React.useEffect(() => {
    if (!autoTuck || mode !== 'idle' || shape !== 'edge' || drag) { setTucked(false); return; }
    const t = setTimeout(() => setTucked(true), 3500); return () => clearTimeout(t);
  }, [mode, autoTuck, shape, drag, side, yf]);
  React.useEffect(() => {
    if (mode !== 'scan') return;
    const t = setTimeout(() => { setMode('reading'); started.current = true; pb.load(0, true); }, 1500); return () => clearTimeout(t);
  }, [mode]);
  React.useEffect(() => {
    if (mode === 'reading' && started.current && !pb.playing && pb.active < 0) { started.current = false; setExpanded(false); setMode('idle'); }
  }, [pb.playing, pb.active, mode]);
  React.useEffect(() => {
    const c = scrollRef.current; if (!follow || !c || pb.active < 0) return;
    const el = c.querySelector(`[data-i="${pb.active}"]`); if (!el) return;
    const r = el.getBoundingClientRect(), cr = c.getBoundingClientRect();
    if (r.top < cr.top + 24 || r.bottom > cr.bottom - cr.height * 0.4) c.scrollTo({ top: c.scrollTop + r.top - cr.top - cr.height * 0.2, behavior: 'smooth' });
  }, [pb.active, follow]);

  const trashHit = (x, y, r) => Math.hypot(x - r.width / 2, y - (r.height - 64)) < 56;
  const down = e => { e.currentTarget.setPointerCapture(e.pointerId); st.current = { x0: e.clientX, y0: e.clientY, r: areaRef.current.getBoundingClientRect(), moved: false }; };
  const move = e => { const s = st.current; if (!s) return; if (!s.moved && Math.hypot(e.clientX - s.x0, e.clientY - s.y0) < 6) return; s.moved = true;
    const x = e.clientX - s.r.left, y = e.clientY - s.r.top; setDrag({ x: x - 28, y: y - 28 }); setOverTrash(trashHit(x, y, s.r)); };
  const up = e => { const s = st.current; st.current = null; if (!s) return;
    if (!s.moved) { if (tucked) setTucked(false); setMode('menu'); return; }
    const x = e.clientX - s.r.left, y = e.clientY - s.r.top;
    setDrag(null); setOverTrash(false);
    if (trashHit(x, y, s.r)) { setMode('hidden'); return; }
    setSide(x < s.r.width / 2 ? 'left' : 'right'); setYf(Math.min(0.8, Math.max(0.06, (y - 28) / s.r.height))); };

  const startRead = () => { setExpanded(false); setMode('scan'); };
  const startPick = () => { pb.load(-1, false); setMode('pick'); };
  const picked = i => { started.current = true; setMode('reading'); pb.seek(i); };
  const stop = () => { started.current = false; pb.load(-1, false); setExpanded(false); setMode('idle'); };

  const edgeStyle = drag ? { left: drag.x, top: drag.y, transition: 'none' } : { [side]: tucked ? 0 : 8, top: `${yf * 100}%` };

  return <div className="b-area" ref={areaRef}>
    <HostApp host={host} active={mode === 'reading' ? pb.active : -1} read={mode === 'reading' ? pb.active : -1} pick={mode === 'pick'} scanning={mode === 'scan'} onPick={picked} scrollRef={scrollRef} />

    {mode === 'idle' && shape === 'edge' ? <button type="button" className={'b-bubble b-side-' + side + (tucked ? ' is-tucked' : '') + (drag ? ' is-drag' : '')} style={edgeStyle} aria-label="Ouvrir le menu de lecture Fish Reader" onPointerDown={down} onPointerMove={move} onPointerUp={up}>
      <span className="b-bubble-face"><Icon name="volume" size={22} /></span>
    </button> : null}
    {mode === 'idle' && shape === 'pill' ? <button type="button" className="b-idlepill" aria-label="Ouvrir le menu de lecture Fish Reader" onClick={() => setMode('menu')}><Icon name="volume" size={18} /><span>Lire</span></button> : null}
    {drag ? <div className={'b-trash' + (overTrash ? ' is-over' : '')} aria-hidden="true"><Icon name="close" size={22} /><span>Masquer</span></div> : null}

    {mode === 'menu' ? <MenuSheet speed={speed} setSpeed={setSpeed} voice={voice} setVoice={setVoice} follow={follow} setFollow={setFollow} onRead={startRead} onPick={startPick} onHide={() => setMode('hidden')} onClose={() => setMode('idle')} /> : null}

    {mode === 'scan' ? <div className="b-pill" role="status"><span className="b-spin" aria-hidden="true"></span><span className="b-pill-txt"><b>Lecture de l’écran…</b><span>Fish Reader repère le texte affiché</span></span></div> : null}

    {mode === 'pick' ? <>
      <div className="b-pickbar" role="status"><span>Touchez la phrase où commencer</span><Button variant="ghost" onClick={() => setMode('menu')}>Annuler</Button></div>
    </> : null}

    {mode === 'reading' && !expanded ? <div className="b-pill is-reading">
      <button type="button" className="b-pill-open" aria-label="Ouvrir le lecteur" onClick={() => setExpanded(true)}>
        <LiveWave playing={pb.playing} />
        <span className="b-pill-txt"><b>{pb.playing ? `${v.name} lit` : 'En pause'}</b><span className="b-tab">{`Phrase ${pb.active + 1} sur ${sentences.length} · ${fmtSpeed(speed)}`}</span></span>
      </button>
      <button type="button" className="fr-play" aria-label={pb.playing ? 'Pause' : 'Reprendre'} onClick={pb.toggle}><Icon name={pb.playing ? 'pause' : 'play'} size={22} /></button>
      <button type="button" className="b-pill-stop" aria-label="Arrêter la lecture" onClick={stop}>{STOP_SVG}</button>
    </div> : null}

    {mode === 'reading' && expanded ? <BubblePlayer pb={pb} v={v} total={sentences.length} speed={speed} setSpeed={setSpeed} onReduce={() => setExpanded(false)} onPick={startPick} onStop={stop} /> : null}

    {mode === 'hidden' ? <div className="b-toast" role="status"><span>La bulle est masquée. Rouvrez Fish Reader pour l’afficher.</span><Button variant="ghost" onClick={() => setMode('idle')}>Annuler</Button></div> : null}
  </div>;
}

Object.assign(window, { BubbleOverlay, HOSTS });
