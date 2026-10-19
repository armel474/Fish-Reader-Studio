function HomeScreen({ docs, onOpen, bubbleOn, setBubbleOn, speed, setSpeed, voice, setVoice, onShowBubble, currentId }) {
  const { SectionLabel, Segmented, Chip, Badge, Button } = FRDS;
  return <div className="m-scroll">
    <MHeader title="Fish Reader" />
    <div className="m-home">
      <div>
        <h2 className="m-greet">Bon retour, Armel</h2>
        <p className="m-lede">Reprenez là où vous vous êtes arrêté.</p>
        <SectionLabel>Récents</SectionLabel>
        <div className="fr-list" role="list">{docs.slice(0, 3).map(d =>
          <button key={d.id} type="button" role="listitem" className="m-doc" onClick={() => onOpen(d)}>
            <span className="m-doc-main"><span className="m-doc-title">{d.title}</span><span className="m-doc-meta">{d.id === currentId ? 'En cours' : d.when}{d.progress ? ` · ${d.progress}${NBS}%` : ''}</span></span>
            <span className="fr-session-progress" aria-hidden="true"><span style={{ width: (d.progress || 0) + '%' }}></span></span>
          </button>)}</div>
      </div>
      <section className="m-card m-quick" aria-label="Réglages rapides">
        <div className="m-quick-row">
          <div className="m-quick-txt"><p className="m-quick-title">Bulle de lecture</p><p className="m-quick-sub"><Badge tone={bubbleOn ? 'accent' : 'neutral'}>{bubbleOn ? 'Active' : 'En pause'}</Badge><span>{bubbleOn ? 'Affichée sur toutes vos applications' : 'Masquée sur les autres applications'}</span></p></div>
          <Switch checked={bubbleOn} onChange={setBubbleOn} label="Bulle de lecture" />
        </div>
        <Button variant="secondary" size="lg" icon="volume" className="m-full" onClick={onShowBubble}>Voir la bulle en action</Button>
        <div className="m-sep"></div>
        <div className="m-lbl"><span>Vitesse</span><span className="m-num">{fmtSpeed(speed)}</span></div>
        <div className="m-seg5"><Segmented label="Vitesse de lecture" value={speed} onChange={setSpeed} options={SPEEDS.map(s => ({ value: s, label: fmtSpeed(s) }))} /></div>
        <div className="m-lbl"><span>Voix</span></div>
        <div className="m-chips">{VOICES.map(v => <Chip key={v.id} selected={voice === v.id} onClick={() => setVoice(v.id)}>{v.name}</Chip>)}</div>
      </section>
    </div>
  </div>;
}

function ReaderScreen({ doc, pb, onPaste }) {
  const { ReaderText, Button } = FRDS;
  const ref = React.useRef(null);
  React.useEffect(() => {
    const c = ref.current; const el = c && c.querySelector('.fr-sent.is-active'); if (!el) return;
    const r = el.getBoundingClientRect(), cr = c.getBoundingClientRect();
    if (r.top < cr.top + 64 || r.bottom > cr.bottom - 32) c.scrollTo({ top: c.scrollTop + r.top - cr.top - cr.height * 0.3, behavior: 'smooth' });
  }, [pb.active]);
  return <div className="m-scroll" ref={ref}>
    <div className="m-reader-top"><Button variant="secondary" icon="plus" onClick={onPaste}>Nouveau texte</Button></div>
    <div className="m-reader">
      <ReaderText kicker={doc.kicker} title={doc.title} paragraphs={doc.paragraphs} active={pb.active} onSeek={pb.seek} />
      {pb.active < 0 && !pb.playing ? <p className="m-hint">Touchez une phrase pour lancer la lecture à cet endroit.</p> : null}
    </div>
  </div>;
}

function PasteSheet({ onClose, onRead }) {
  const { Button, IconButton } = FRDS;
  const [txt, setTxt] = React.useState('');
  const [err, setErr] = React.useState('');
  const paste = async () => {
    setErr('');
    try { const t = await navigator.clipboard.readText(); if (!t.trim()) throw 0; setTxt(t); }
    catch (e) { setErr(`Fish Reader n’a pas pu lire le presse-papiers. Faites un appui long dans le champ, puis choisissez «${NB}Coller${NB}».`); }
  };
  const ok = txt.trim().length > 0;
  return <div className="m-sheet" role="dialog" aria-label="Nouveau texte">
    <MHeader title="Nouveau texte"><IconButton icon="close" size="lg" label="Fermer" onClick={onClose} /></MHeader>
    <div className="m-sheet-body">
      <label className="m-lbl" htmlFor="m-ta"><span>Votre texte ou article</span><span className="m-num">{txt.trim() ? txt.trim().split(/\s+/).length : 0} mots</span></label>
      <textarea id="m-ta" className="m-ta" value={txt} onChange={e => setTxt(e.target.value)} placeholder="Collez ici un courriel, un article ou n’importe quel texte."></textarea>
      {err ? <p className="m-err" role="alert">{err}</p> : null}
    </div>
    <div className="m-sheet-actions">
      {!ok ? <p className="m-caption">Collez ou saisissez un texte pour commencer.</p> : null}
      <Button variant="secondary" size="lg" icon="copy" className="m-full" onClick={paste}>Coller depuis le presse-papiers</Button>
      <Button variant="primary" size="lg" icon="play" className="m-full" disabled={!ok} onClick={() => onRead(txt)}>Lire ce texte</Button>
    </div>
  </div>;
}

function VoicesScreen({ voice, setVoice, speed, setSpeed, timbre, setTimbre }) {
  const { VoiceCard, IconButton, Segmented } = FRDS;
  const [sampling, setSampling] = React.useState(null);
  const stopRef = React.useRef(null);
  React.useEffect(() => () => stopRef.current && stopRef.current(), []);
  const sample = v => {
    if (stopRef.current) stopRef.current();
    if (sampling === v.id) { setSampling(null); return; }
    setSampling(v.id); stopRef.current = speakSample(v, () => setSampling(s => s === v.id ? null : s));
  };
  const pct = ((speed - 0.5) / 1.5) * 100;
  return <div className="m-scroll">
    <MHeader title="Voix et vitesse" />
    <div className="m-body m-stack">
      <p className="m-lede">Choisissez la voix qui lira vos textes. Touchez le bouton d’écoute pour entendre un extrait.</p>
      {VOICES.map(v => <div key={v.id} className="m-vwrap">
        <VoiceCard name={v.name} lang={v.lang} description={v.desc} seed={v.seed} selected={voice === v.id} onSelect={() => setVoice(v.id)} />
        <IconButton icon={sampling === v.id ? 'pause' : 'play'} size="lg" className="m-sample" label={(sampling === v.id ? 'Arrêter l’extrait de ' : 'Écouter un extrait de ') + v.name} onClick={() => sample(v)} />
      </div>)}
      <section className="m-card" aria-label="Vitesse">
        <div className="m-lbl"><span>Vitesse de lecture</span></div>
        <div className="m-speedval" aria-live="polite">{fmtSpeed(speed)}</div>
        <input className="m-range" type="range" min="0.5" max="2" step="0.05" value={speed} style={{ '--p': pct + '%' }} aria-label="Vitesse de lecture" aria-valuetext={fmtSpeed(speed)} onChange={e => setSpeed(parseFloat(e.target.value))} />
        <div className="m-ticks">{[0.75, 1, 1.25, 1.5, 2].map(s => <button key={s} type="button" aria-pressed={Math.abs(speed - s) < 0.001} onClick={() => setSpeed(s)}>{fmtSpeed(s)}</button>)}</div>
      </section>
      <section className="m-card" aria-label="Timbre">
        <div className="m-lbl"><span>Timbre</span></div>
        <div className="m-seg3"><Segmented label="Timbre de la voix" value={timbre} onChange={setTimbre} options={[{ value: 'doux', label: 'Plus doux' }, { value: 'naturel', label: 'Naturel' }, { value: 'clair', label: 'Plus clair' }]} /></div>
      </section>
    </div>
  </div>;
}

function OverlayScreen({ bubbleOn, setBubbleOn, speed, setSpeed, voice, onExit }) {
  const { Button, IconButton, Icon } = FRDS;
  const sentences = React.useMemo(() => ARTICLE.paragraphs.flat(), []);
  const pb = usePlayback(sentences, speed);
  const [mini, setMini] = React.useState(false);
  const [side, setSide] = React.useState('right');
  const [yf, setYf] = React.useState(0.62);
  const [drag, setDrag] = React.useState(null);
  const areaRef = React.useRef(null), st = React.useRef(null);
  const v = VOICES.find(x => x.id === voice);
  const down = e => { e.currentTarget.setPointerCapture(e.pointerId); const r = areaRef.current.getBoundingClientRect(); st.current = { x0: e.clientX, y0: e.clientY, r, moved: false }; };
  const move = e => { const s = st.current; if (!s) return; if (!s.moved && Math.hypot(e.clientX - s.x0, e.clientY - s.y0) < 6) return; s.moved = true; setDrag({ x: e.clientX - s.r.left - 28, y: e.clientY - s.r.top - 28 }); };
  const up = e => { const s = st.current; st.current = null; if (!s) return;
    if (!s.moved) { setMini(true); return; }
    const x = e.clientX - s.r.left, y = e.clientY - s.r.top;
    setSide(x < s.r.width / 2 ? 'left' : 'right'); setYf(Math.min(0.85, Math.max(0.08, (y - 28) / s.r.height))); setDrag(null); };
  let idx = 0;
  const bubbleStyle = drag ? { left: drag.x, top: drag.y, transition: 'none' } : { [side]: 8, top: `calc(${yf * 100}% )` };
  return <div className="m-ov">
    <div className="m-ov-note"><span>Aperçu : la bulle par-dessus une autre application</span><Button variant="ghost" icon="close" onClick={onExit}>Quitter</Button></div>
    <div className="m-ov-app" ref={areaRef}>
      <div className="m-ov-bar"><span className="m-ov-url">journal-regional.ca/traversier</span></div>
      <div className="m-ov-article">
        <p className="fr-reader-kicker">Actualités régionales</p>
        <h2 className="m-ov-h">{ARTICLE.title}</h2>
        {ARTICLE.paragraphs.map((p, pi) => <p key={pi}>{p.map(s => { const i = idx++; return <React.Fragment key={i}><span className={'fr-sent' + (i === pb.active ? ' is-active' : i < pb.active ? ' is-read' : '')} onClick={() => bubbleOn && pb.seek(i)}>{s}</span>{' '}</React.Fragment>; })}</p>)}
      </div>
      {bubbleOn && !mini ? <button type="button" className={'m-bubble' + (pb.playing ? ' is-playing' : '')} style={bubbleStyle} aria-label="Ouvrir le mini-lecteur Fish Reader" onPointerDown={down} onPointerMove={move} onPointerUp={up}><Icon name={pb.playing ? 'pause' : 'volume'} size={22} /></button> : null}
      {bubbleOn && mini ? <div className="m-mini" role="region" aria-label="Mini-lecteur">
        <div className="m-mini-head">
          <span className="fr-avatar" aria-hidden="true">{v.name[0]}</span>
          <div className="m-mini-txt"><p className="fr-player-name">{v.name} lit cet écran</p><p className="fr-player-sub">{pb.active < 0 ? 'Prêt à lire l’article affiché' : `Phrase ${pb.active + 1} sur ${sentences.length}`}</p></div>
          <IconButton icon="close" size="lg" label="Réduire en bulle" onClick={() => setMini(false)} />
        </div>
        <div className="m-line is-inline"><span style={{ width: pb.progress + '%' }}></span></div>
        <Transport pb={pb} speed={speed} onSpeed={setSpeed} compact />
      </div> : null}
      {!bubbleOn ? <div className="m-mini m-mini-off"><p className="m-quick-title">La bulle est en pause</p><p className="m-caption">Activez-la pour écouter le texte de cette application.</p><Button variant="primary" size="lg" className="m-full" onClick={() => setBubbleOn(true)}>Activer la bulle</Button></div> : null}
      {bubbleOn && !mini && !drag ? <p className="m-ov-tip">Touchez la bulle pour ouvrir le lecteur. Glissez-la pour la déplacer.</p> : null}
    </div>
  </div>;
}

Object.assign(window, { HomeScreen, ReaderScreen, PasteSheet, VoicesScreen, OverlayScreen });
