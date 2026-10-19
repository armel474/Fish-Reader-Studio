const FRDS = window.FishReaderStudioDesignSystem_d3e59a;
const NB = '\u202F', NBS = '\u00A0';
const SPEEDS = [0.75, 1, 1.15, 1.25, 1.5];
const fmtSpeed = v => (Math.round(v * 100) / 100).toString().replace('.', ',') + '×';
const fmtTime = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const SEC_PER_CHAR = 0.065;

const VOICES = [
  { id: 'clara', name: 'Clara', lang: 'Français (Québec) · Studio', desc: 'Voix chaleureuse et posée, idéale pour les longs documents.', sample: 'Bonjour, je lirai vos textes.', bcp: 'fr-CA', seed: 2 },
  { id: 'thomas', name: 'Thomas', lang: 'Français (Québec) · Posé', desc: 'Débit calme et grave, pensé pour les romans et les récits.', sample: 'Bonjour, je lirai vos textes.', bcp: 'fr-CA', seed: 5 },
  { id: 'emma', name: 'Emma', lang: 'English (US)', desc: 'Calm, even narration for English documents.', sample: 'Hello, I will read your texts.', bcp: 'en-US', seed: 8 },
];

const DOCS = [
  { id: 'clinique', when: `Aujourd’hui · 7${NBS}h${NBS}42`, kicker: 'Section 2 · Activités', title: 'Rapport annuel 2025 — Clinique Saint-Roch', progress: 64, paragraphs: [
    ['La hausse des consultations en télémédecine s’est confirmée au deuxième trimestre.', 'Près d’un rendez-vous sur trois a eu lieu à distance, surtout pour les suivis en santé mentale.', 'Les patients des rangs éloignés ont gagné en moyenne quarante minutes de route par visite.'],
    ['L’équipe infirmière a été renforcée par deux postes à temps plein.', `Ce renfort a permis d’ouvrir la clinique sans rendez-vous le samedi matin, de 8${NBS}h à midi.`, 'Le temps d’attente moyen est passé de 52 à 31 minutes.'],
    ['Pour 2026, la clinique prévoit d’offrir la prise de rendez-vous en ligne en français et en anglais.', 'Un comité de patients sera consulté avant chaque changement d’horaire.'],
  ] },
  { id: 'loi25', when: 'Hier', kicker: 'Chapitre 1', title: 'Guide Loi 25 — Ce qui change pour vous', progress: 20, paragraphs: [
    ['Depuis septembre 2023, toute entreprise du Québec doit nommer une personne responsable de la protection des renseignements personnels.', 'Par défaut, ce rôle revient à la personne ayant la plus haute autorité dans l’organisation.'],
    ['Vous avez le droit de savoir quels renseignements une entreprise détient à votre sujet.', 'Vous pouvez aussi demander qu’ils soient corrigés ou retirés.', 'L’entreprise dispose de trente jours pour vous répondre.'],
  ] },
  { id: 'ordre', when: 'Lundi', kicker: 'Infolettre', title: 'Infolettre de l’Ordre — Octobre', progress: 0, paragraphs: [
    ['Le prochain congrès annuel se tiendra à Québec les 14 et 15 novembre.', 'Les inscriptions ferment le 31 octobre.'],
    ['Les heures de formation continue doivent être déclarées avant le 31 mars.', 'Un rappel vous sera envoyé deux semaines avant l’échéance.'],
  ] },
];

const ARTICLE = { title: 'Le traversier reprend ses départs réguliers', paragraphs: [
  ['Le traversier entre Sorel-Tracy et Saint-Ignace-de-Loyola reprendra ses départs réguliers lundi matin.', 'Les travaux sur le quai ont été terminés avec une semaine d’avance.'],
  [`Le service rappelle que les départs de 6${NBS}h${NBS}15 sont souvent complets.`, 'Les usagers sont invités à réserver leur place en ligne la veille.', 'Les cyclistes pourront embarquer sans réservation.'],
] };

function splitText(raw) {
  return raw.split(/\n\s*\n/).map(p => p.replace(/\s+/g, ' ').trim()).filter(Boolean)
    .map(p => (p.match(/[^.!?…]+[.!?…]+[»"”)]*|[^.!?…]+$/g) || [p]).map(s => s.trim()).filter(Boolean));
}

function usePlayback(sentences, speed) {
  const [active, setActive] = React.useState(-1);
  const [playing, setPlaying] = React.useState(false);
  React.useEffect(() => {
    if (!playing) return;
    if (active < 0) { setActive(0); return; }
    const ms = Math.max(1400, sentences[active].length * SEC_PER_CHAR * 1000) / speed;
    const t = setTimeout(() => {
      if (active + 1 >= sentences.length) { setPlaying(false); setActive(-1); } else setActive(active + 1);
    }, ms);
    return () => clearTimeout(t);
  }, [playing, active, speed, sentences]);
  const charsBefore = i => sentences.slice(0, Math.max(0, i)).reduce((a, s) => a + s.length, 0);
  const total = charsBefore(sentences.length);
  return {
    active, playing,
    load: (i, play) => { setActive(i); setPlaying(!!play); },
    toggle: () => setPlaying(p => !p),
    seek: i => { setActive(i); setPlaying(true); },
    next: () => setActive(a => Math.min(sentences.length - 1, a + 1)),
    back15: () => setActive(a => { const need = 15 * speed / SEC_PER_CHAR; let i = Math.max(0, a), acc = 0; while (i > 0 && acc < need) { i--; acc += sentences[i].length; } return i; }),
    skipSent: n => setActive(a => Math.min(sentences.length - 1, Math.max(0, Math.max(0, a) + n))),
    skipSec: sec => setActive(a => { a = Math.max(0, a); const need = Math.abs(sec) * speed / SEC_PER_CHAR; let i = a, acc = 0;
      if (sec < 0) { while (i > 0 && acc < need) { i--; acc += sentences[i].length; } }
      else { while (i < sentences.length - 1 && acc < need) { acc += sentences[i].length; i++; } }
      return i; }),
    elapsed: charsBefore(active) * SEC_PER_CHAR / speed,
    duration: total * SEC_PER_CHAR / speed,
    progress: active < 0 ? 0 : (charsBefore(active) / total) * 100,
  };
}

function speakSample(v, onEnd) {
  try {
    const ss = window.speechSynthesis; if (!ss) throw 0;
    ss.cancel();
    const u = new SpeechSynthesisUtterance(v.sample); u.lang = v.bcp; u.onend = onEnd; u.onerror = onEnd;
    ss.speak(u); return () => ss.cancel();
  } catch (e) { const t = setTimeout(onEnd, 2200); return () => clearTimeout(t); }
}

function Switch({ checked, onChange, label }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="m-switch" onClick={() => onChange(!checked)}><span className="m-switch-track"><span className="m-switch-knob"></span></span></button>;
}

function TabBar({ tab, onTab }) {
  const items = [['home', 'home', 'Accueil'], ['reader', 'studio', 'Liseuse'], ['voices', 'voices', 'Voix']];
  return <nav className="m-tabs" aria-label="Navigation principale">{items.map(([id, ic, l]) =>
    <button key={id} type="button" className="m-tab" aria-current={tab === id ? 'page' : undefined} onClick={() => onTab(id)}>
      <span className="m-tab-ic"><FRDS.Icon name={ic} size={20} /></span><span>{l}</span>
    </button>)}</nav>;
}

function MHeader({ title, serif = true, children }) {
  return <header className="m-head"><h1 className={'m-head-title' + (serif ? '' : ' is-sans')}>{title}</h1>{children}</header>;
}

function Transport({ pb, speed, onSpeed, compact }) {
  const { IconButton, Icon } = FRDS;
  const cycle = () => { const n = SPEEDS.find(s => s > speed + 0.001); onSpeed(n || SPEEDS[0]); };
  return <div className={'m-transport' + (compact ? ' is-compact' : '')}>
    <span className="m-time">{fmtTime(pb.elapsed)}</span>
    <div className="m-transport-mid">
      <IconButton icon="rewind" size="lg" label="Reculer de 15 secondes" onClick={pb.back15} />
      <button type="button" className="fr-play" aria-label={pb.playing ? 'Pause' : 'Lire'} onClick={pb.toggle}><Icon name={pb.playing ? 'pause' : 'play'} size={22} /></button>
      <IconButton icon="forward" size="lg" label="Phrase suivante" onClick={pb.next} />
    </div>
    <button type="button" className="m-speed" aria-label={'Vitesse ' + fmtSpeed(speed) + ', toucher pour changer'} onClick={cycle}>{fmtSpeed(speed)}</button>
  </div>;
}

Object.assign(window, { FRDS, NB, NBS, SPEEDS, fmtSpeed, fmtTime, VOICES, DOCS, ARTICLE, splitText, usePlayback, speakSample, Switch, TabBar, MHeader, Transport });
