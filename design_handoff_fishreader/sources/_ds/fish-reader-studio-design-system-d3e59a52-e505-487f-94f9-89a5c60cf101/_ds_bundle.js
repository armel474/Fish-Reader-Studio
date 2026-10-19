/* @ds-bundle: {"format":4,"namespace":"FishReaderStudioDesignSystem_d3e59a","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"IconButton","sourcePath":"components/actions/IconButton.jsx"},{"name":"Badge","sourcePath":"components/badge/Badge.jsx"},{"name":"Banner","sourcePath":"components/banner/Banner.jsx"},{"name":"SectionLabel","sourcePath":"components/history/SectionLabel.jsx"},{"name":"SessionList","sourcePath":"components/history/SessionList.jsx"},{"name":"SessionRow","sourcePath":"components/history/SessionRow.jsx"},{"name":"ICON_NAMES","sourcePath":"components/icon/Icon.jsx"},{"name":"Icon","sourcePath":"components/icon/Icon.jsx"},{"name":"Chip","sourcePath":"components/inputs/Chip.jsx"},{"name":"SearchField","sourcePath":"components/inputs/SearchField.jsx"},{"name":"Segmented","sourcePath":"components/inputs/Segmented.jsx"},{"name":"AppShell","sourcePath":"components/navigation/AppShell.jsx"},{"name":"NavItem","sourcePath":"components/navigation/NavItem.jsx"},{"name":"Sidebar","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"PlayerBar","sourcePath":"components/reader/PlayerBar.jsx"},{"name":"ReaderText","sourcePath":"components/reader/ReaderText.jsx"},{"name":"StatCard","sourcePath":"components/stats/StatCard.jsx"},{"name":"VoiceCard","sourcePath":"components/voices/VoiceCard.jsx"},{"name":"Wave","sourcePath":"components/voices/Wave.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"c084c5cbef63","components/actions/IconButton.jsx":"a97f16798f0b","components/badge/Badge.jsx":"f1128c5cdd1f","components/banner/Banner.jsx":"841b13449fad","components/history/SectionLabel.jsx":"6707d708cf80","components/history/SessionList.jsx":"119a21a4173b","components/history/SessionRow.jsx":"ee1ee950e5bd","components/icon/Icon.jsx":"4b6da526e74b","components/inputs/Chip.jsx":"d00c4f34f674","components/inputs/SearchField.jsx":"c935905e4142","components/inputs/Segmented.jsx":"ff62f97bba16","components/navigation/AppShell.jsx":"a06a0804968c","components/navigation/NavItem.jsx":"d4f86f7b73d7","components/navigation/Sidebar.jsx":"e624a38f5e34","components/reader/PlayerBar.jsx":"79c820411943","components/reader/ReaderText.jsx":"b520265b6b09","components/stats/StatCard.jsx":"18eef7555d20","components/voices/VoiceCard.jsx":"f7a543469ae4","components/voices/Wave.jsx":"bf5e047e72fe","ui_kits/studio/Accueil.jsx":"e50eaf52d588","ui_kits/studio/Studio.jsx":"a67085983558","ui_kits/studio/Voix.jsx":"16abdb2bfb4a"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.FishReaderStudioDesignSystem_d3e59a = window.FishReaderStudioDesignSystem_d3e59a || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/badge/Badge.jsx
try { (() => {
function cx(...a) {
  return a.filter(Boolean).join(' ');
}
function Badge({
  tone = 'neutral',
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: cx('fr-badge', tone !== 'neutral' && 'fr-badge--' + tone)
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/badge/Badge.jsx", error: String((e && e.message) || e) }); }

// components/history/SectionLabel.jsx
try { (() => {
function SectionLabel({
  action,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "fr-section"
  }, /*#__PURE__*/React.createElement("span", null, children), action || null);
}
Object.assign(__ds_scope, { SectionLabel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/history/SectionLabel.jsx", error: String((e && e.message) || e) }); }

// components/history/SessionList.jsx
try { (() => {
function SessionList({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "fr-list",
    role: "list"
  }, children);
}
Object.assign(__ds_scope, { SessionList });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/history/SessionList.jsx", error: String((e && e.message) || e) }); }

// components/icon/Icon.jsx
try { (() => {
function cx(...a) {
  return a.filter(Boolean).join(' ');
}
const P = {
  home: 'M3.5 10.5 12 4l8.5 6.5V19a1 1 0 0 1-1 1H15v-5.5H9V20H4.5a1 1 0 0 1-1-1z',
  studio: 'M2.5 5.5H8a3.5 3.5 0 0 1 3.5 3.5v10.5a2 2 0 0 0-2-2h-7zM21.5 5.5H16A3.5 3.5 0 0 0 12.5 9v10.5a2 2 0 0 1 2-2h7z',
  library: 'M4.5 5.5a2 2 0 0 1 2-2h13v15h-13a2 2 0 0 0-2 2zM4.5 20.5v-15M8.5 7.5h7',
  voices: 'M4 10v4M8 6.5v11M12 3.5v17M16 7.5v9M20 10v4',
  bookmark: 'M6.5 3.5h11v17l-5.5-4-5.5 4z',
  stats: 'M5 20V11M12 20V5M19 20v-6',
  settings: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  help: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM9.5 9.2a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.5V14M12 17.2v.3',
  rewind: 'M11 17 6 12l5-5M18 17l-5-5 5-5',
  forward: 'M13 7l5 5-5 5M6 7l5 5-5 5',
  copy: 'M9 9h10.5v10.5H9zM15 9V4.5H4.5V15H9',
  search: 'M10.5 17.5a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20.5 20.5 15.5 15.5',
  close: 'M6 6l12 12M18 6 6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  upload: 'M12 15.5V4M7 8.5 12 4l5 4.5M4.5 20h15',
  volume: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9a4.5 4.5 0 0 1 0 6',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  plus: 'M12 5v14M5 12h14'
};
const FILLED = {
  play: 'M8 5.5v13l10.5-6.5z',
  pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z'
};
const ICON_NAMES = [...Object.keys(P), ...Object.keys(FILLED)];
/** Icône maison : trait 1.5 px, coins arrondis, grille 24 × 24, couleur héritée (currentColor). */
function Icon({
  name,
  size = 18,
  className
}) {
  const filled = FILLED[name];
  return /*#__PURE__*/React.createElement("svg", {
    className: cx('fr-icon', className),
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: filled ? 'currentColor' : 'none',
    stroke: filled ? 'none' : 'currentColor',
    strokeWidth: name === 'more' ? 3 : 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: filled || P[name] || ''
  }));
}
Object.assign(__ds_scope, { ICON_NAMES, Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icon/Icon.jsx", error: String((e && e.message) || e) }); }

// components/actions/Button.jsx
try { (() => {
function cx(...a) {
  return a.filter(Boolean).join(' ');
}
function Button({
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  onClick,
  type = 'button',
  className,
  children
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    className: cx('fr-btn', 'fr-btn--' + variant, size === 'lg' && 'fr-btn--lg', className),
    onClick: onClick,
    disabled: disabled
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18
  }) : null, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/actions/IconButton.jsx
try { (() => {
function cx(...a) {
  return a.filter(Boolean).join(' ');
}
function IconButton({
  icon,
  label,
  size = 'md',
  onClick,
  className
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: cx('fr-iconbtn', size === 'lg' && 'fr-iconbtn--lg', className),
    "aria-label": label,
    title: label,
    onClick: onClick
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === 'lg' ? 22 : 18
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/banner/Banner.jsx
try { (() => {
const LINES = [36, 60, 84, 108, 132, 156];
function Banner({
  title,
  text,
  action,
  onAction,
  onClose
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "fr-banner"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "fr-banner-art",
    viewBox: "0 0 360 200",
    preserveAspectRatio: "xMaxYMid slice",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("rect", {
    className: "pg",
    x: "150",
    y: "20",
    width: "190",
    height: "220"
  }), LINES.map(y => /*#__PURE__*/React.createElement("line", {
    key: y,
    x1: "0",
    y1: y,
    x2: "360",
    y2: y
  })), /*#__PURE__*/React.createElement("rect", {
    className: "hl",
    x: "168",
    y: "88",
    width: "140",
    height: "16"
  })), /*#__PURE__*/React.createElement("h2", {
    className: "fr-banner-title"
  }, title), text ? /*#__PURE__*/React.createElement("p", {
    className: "fr-banner-text"
  }, text) : null, action ? /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "on-accent",
    onClick: onAction
  }, action) : null, onClose !== false ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "close",
    label: "Fermer",
    className: "fr-banner-close",
    onClick: onClose
  }) : null);
}
Object.assign(__ds_scope, { Banner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/banner/Banner.jsx", error: String((e && e.message) || e) }); }

// components/history/SessionRow.jsx
try { (() => {
function SessionRow({
  time,
  title,
  excerpt,
  progress
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "fr-session",
    role: "listitem"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fr-session-time"
  }, time), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "fr-session-title"
  }, title), excerpt ? /*#__PURE__*/React.createElement("p", {
    className: "fr-session-excerpt"
  }, excerpt) : null), /*#__PURE__*/React.createElement("div", {
    className: "fr-session-meta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fr-session-actions"
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "play",
    label: "Reprendre la lecture"
  }), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "copy",
    label: "Copier le texte"
  }), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "bookmark",
    label: "Ajouter un signet"
  }), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "more",
    label: "Plus d\u2019options"
  })), typeof progress === 'number' ? /*#__PURE__*/React.createElement("div", {
    className: "fr-session-progress",
    role: "progressbar",
    "aria-valuenow": progress,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-label": "Progression"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: progress + '%'
    }
  })) : null));
}
Object.assign(__ds_scope, { SessionRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/history/SessionRow.jsx", error: String((e && e.message) || e) }); }

// components/inputs/Chip.jsx
try { (() => {
function Chip({
  selected,
  onClick,
  children
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "fr-chip",
    "aria-pressed": !!selected,
    onClick: onClick
  }, children);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/Chip.jsx", error: String((e && e.message) || e) }); }

// components/inputs/SearchField.jsx
try { (() => {
function SearchField({
  placeholder = 'Rechercher',
  defaultValue,
  onChange
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: "fr-search"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 18
  }), /*#__PURE__*/React.createElement("input", {
    type: "search",
    placeholder: placeholder,
    "aria-label": placeholder,
    defaultValue: defaultValue,
    onChange: onChange ? e => onChange(e.target.value) : undefined
  }));
}
Object.assign(__ds_scope, { SearchField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/SearchField.jsx", error: String((e && e.message) || e) }); }

// components/inputs/Segmented.jsx
try { (() => {
function Segmented({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "fr-seg",
    role: "group",
    "aria-label": label
  }, options.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    "aria-pressed": o.value === value,
    onClick: () => onChange && onChange(o.value)
  }, o.label)));
}
Object.assign(__ds_scope, { Segmented });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/Segmented.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavItem.jsx
try { (() => {
function NavItem({
  icon,
  label,
  count,
  active,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "fr-nav",
    "aria-current": active ? 'page' : undefined,
    onClick: onClick
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 20
  }), /*#__PURE__*/React.createElement("span", null, label), count ? /*#__PURE__*/React.createElement("span", {
    className: "fr-nav-count"
  }, count) : null);
}
Object.assign(__ds_scope, { NavItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavItem.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Sidebar.jsx
try { (() => {
const NAV = [{
  id: 'accueil',
  icon: 'home',
  label: 'Accueil'
}, {
  id: 'studio',
  icon: 'studio',
  label: 'Studio'
}, {
  id: 'bibliotheque',
  icon: 'library',
  label: 'Bibliothèque'
}, {
  id: 'voix',
  icon: 'voices',
  label: 'Voix'
}, {
  id: 'signets',
  icon: 'bookmark',
  label: 'Signets',
  count: 3
}, {
  id: 'statistiques',
  icon: 'stats',
  label: 'Statistiques'
}];
function Sidebar({
  active = 'accueil',
  footer,
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("nav", {
    className: "fr-sidebar",
    "aria-label": "Navigation principale"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fr-brand"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fr-brand-name"
  }, "Fish Reader"), /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "highlight"
  }, "Studio")), NAV.map(n => /*#__PURE__*/React.createElement(__ds_scope.NavItem, {
    key: n.id,
    icon: n.icon,
    label: n.label,
    count: n.count,
    active: n.id === active,
    onClick: () => onNavigate && onNavigate(n.id)
  })), /*#__PURE__*/React.createElement("div", {
    className: "fr-sidebar-spacer"
  }), footer || null, /*#__PURE__*/React.createElement("div", {
    className: "fr-sidebar-sep"
  }), /*#__PURE__*/React.createElement(__ds_scope.NavItem, {
    icon: "settings",
    label: "R\xE9glages"
  }), /*#__PURE__*/React.createElement(__ds_scope.NavItem, {
    icon: "help",
    label: "Aide"
  }));
}
Object.assign(__ds_scope, { Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Sidebar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/AppShell.jsx
try { (() => {
function AppShell({
  active,
  onNavigate,
  sidebarFooter,
  height = '100%',
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "fr fr-shell",
    style: {
      height
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Sidebar, {
    active: active,
    footer: sidebarFooter,
    onNavigate: onNavigate
  }), /*#__PURE__*/React.createElement("main", {
    className: "fr-main"
  }, children));
}
Object.assign(__ds_scope, { AppShell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/AppShell.jsx", error: String((e && e.message) || e) }); }

// components/reader/PlayerBar.jsx
try { (() => {
function PlayerBar({
  playing,
  progress = 0,
  elapsed = '0:00',
  remaining = '',
  voice = {
    name: 'Élise',
    sub: 'Français (Québec) · Narration'
  },
  speedControl,
  onToggle,
  onPrev,
  onNext
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "fr-player"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fr-player-voice"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fr-avatar",
    "aria-hidden": "true"
  }, voice.name.charAt(0)), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "fr-player-name"
  }, voice.name), /*#__PURE__*/React.createElement("p", {
    className: "fr-player-sub"
  }, voice.sub))), /*#__PURE__*/React.createElement("div", {
    className: "fr-player-controls"
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "rewind",
    label: "Phrase pr\xE9c\xE9dente",
    onClick: onPrev
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "fr-play",
    "aria-label": playing ? 'Pause' : 'Lire',
    onClick: onToggle
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: playing ? 'pause' : 'play',
    size: 22
  })), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "forward",
    label: "Phrase suivante",
    onClick: onNext
  })), /*#__PURE__*/React.createElement("div", {
    className: "fr-player-right"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fr-progress"
  }, /*#__PURE__*/React.createElement("span", null, elapsed), /*#__PURE__*/React.createElement("div", {
    className: "fr-progress-track",
    role: "progressbar",
    "aria-valuenow": Math.round(progress),
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-label": "Progression"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: progress + '%'
    }
  })), /*#__PURE__*/React.createElement("span", null, remaining)), speedControl || null));
}
Object.assign(__ds_scope, { PlayerBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/reader/PlayerBar.jsx", error: String((e && e.message) || e) }); }

// components/reader/ReaderText.jsx
try { (() => {
function cx(...a) {
  return a.filter(Boolean).join(' ');
}
function ReaderText({
  paragraphs = [],
  active = -1,
  onSeek,
  kicker,
  title
}) {
  let idx = 0;
  const a = active == null ? -1 : active;
  return /*#__PURE__*/React.createElement("article", {
    className: "fr-reader"
  }, kicker ? /*#__PURE__*/React.createElement("p", {
    className: "fr-reader-kicker"
  }, kicker) : null, title ? /*#__PURE__*/React.createElement("h1", {
    className: "fr-reader-h"
  }, title) : null, paragraphs.map((sentences, pi) => /*#__PURE__*/React.createElement("p", {
    key: pi
  }, sentences.map(s => {
    const i = idx++;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, /*#__PURE__*/React.createElement("span", {
      className: cx('fr-sent', i === a && 'is-active', i < a && 'is-read'),
      onClick: () => onSeek && onSeek(i)
    }, s), ' ');
  }))));
}
Object.assign(__ds_scope, { ReaderText });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/reader/ReaderText.jsx", error: String((e && e.message) || e) }); }

// components/stats/StatCard.jsx
try { (() => {
function StatCard({
  stats = [],
  goal
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "fr-stats"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fr-stats-top"
  }, stats.map(s => /*#__PURE__*/React.createElement("div", {
    className: "fr-stat",
    key: s.label
  }, /*#__PURE__*/React.createElement("span", {
    className: "fr-stat-value"
  }, s.value), /*#__PURE__*/React.createElement("span", {
    className: "fr-stat-label"
  }, s.label)))), goal ? /*#__PURE__*/React.createElement("div", {
    className: "fr-stats-bottom"
  }, /*#__PURE__*/React.createElement("p", {
    className: "fr-stats-title"
  }, goal.title), /*#__PURE__*/React.createElement("p", {
    className: "fr-stats-caption"
  }, goal.caption), /*#__PURE__*/React.createElement("div", {
    className: "fr-meter"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fr-meter-track",
    role: "progressbar",
    "aria-valuenow": goal.value,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-label": goal.title
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: goal.value + '%'
    }
  })), /*#__PURE__*/React.createElement("span", null, goal.label))) : null);
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/stats/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/voices/Wave.jsx
try { (() => {
function Wave({
  seed = 1
}) {
  const bars = [];
  for (let i = 0; i < 18; i++) {
    const v = Math.abs(Math.sin(seed * 3.1 + i * 0.9) * 0.7 + Math.sin(i * 0.37 + seed) * 0.3);
    bars.push(/*#__PURE__*/React.createElement("i", {
      key: i,
      style: {
        height: Math.round(4 + v * 20) + 'px'
      }
    }));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "fr-wave",
    "aria-hidden": "true"
  }, bars);
}
Object.assign(__ds_scope, { Wave });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/voices/Wave.jsx", error: String((e && e.message) || e) }); }

// components/voices/VoiceCard.jsx
try { (() => {
function VoiceCard({
  name,
  lang,
  description,
  selected,
  onSelect,
  tag,
  seed
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "fr-voice",
    "aria-pressed": !!selected,
    onClick: onSelect
  }, selected ? /*#__PURE__*/React.createElement("span", {
    className: "fr-check",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 14
  })) : null, /*#__PURE__*/React.createElement("div", {
    className: "fr-voice-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fr-avatar fr-avatar--lg",
    "aria-hidden": "true"
  }, name.charAt(0)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "fr-voice-name"
  }, name), /*#__PURE__*/React.createElement("p", {
    className: "fr-voice-lang"
  }, lang))), /*#__PURE__*/React.createElement("p", {
    className: "fr-voice-desc"
  }, description), /*#__PURE__*/React.createElement("div", {
    className: "fr-voice-foot"
  }, /*#__PURE__*/React.createElement(__ds_scope.Wave, {
    seed: seed || name.length
  }), tag ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: tag.tone
  }, tag.label) : null));
}
Object.assign(__ds_scope, { VoiceCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/voices/VoiceCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/studio/Accueil.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Button,
  Banner,
  SectionLabel,
  SessionList,
  SessionRow,
  IconButton,
  StatCard
} = window.FishReaderStudioDesignSystem_d3e59a;
const TODAY = [{
  time: '7 h 42',
  title: 'Rapport annuel 2025 — Clinique Saint-Roch',
  excerpt: 'La hausse des consultations en télémédecine s’est confirmée au deuxième trimestre…',
  progress: 64
}, {
  time: '6 h 15',
  title: 'Le Survenant — Chapitre 3',
  excerpt: 'Un soir d’automne, au Chenal du Moine, le Survenant frappa à la porte des Beauchemin…',
  progress: 100
}];
const YESTERDAY = [{
  time: '21 h 08',
  title: 'Loi 25 : guide de conformité pour les PME',
  excerpt: 'Toute entreprise qui recueille des renseignements personnels doit désigner un responsable…',
  progress: 38
}, {
  time: '12 h 30',
  title: 'Infolettre — Ordre des comptables',
  excerpt: 'Les nouvelles exigences de formation continue entrent en vigueur le 1er avril…',
  progress: 100
}, {
  time: '8 h 02',
  title: 'Notes de réunion — Lancement automne',
  excerpt: 'Prochaine étape : valider les textes de la page d’accueil avec l’équipe…',
  progress: 12
}];
function ContinueCard({
  onResume
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '0 4px',
      padding: 16,
      border: '1px solid var(--rule)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--paper-raised)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 2px',
      font: '600 12px/18px var(--font-sans)',
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      color: 'var(--accent)'
    }
  }, "En cours"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 12px',
      font: '600 15px/20px var(--font-serif)'
    }
  }, "Rapport annuel 2025"), /*#__PURE__*/React.createElement("div", {
    className: "fr-meter",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "fr-meter-track"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '64%'
    }
  })), /*#__PURE__*/React.createElement("span", null, "64 %")), /*#__PURE__*/React.createElement(Button, {
    icon: "play",
    onClick: onResume
  }, "Reprendre"));
}
function Accueil({
  onOpenStudio
}) {
  const [banner, setBanner] = React.useState(true);
  return /*#__PURE__*/React.createElement("div", {
    className: "fr-main-inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fr-col"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "fr-h1"
  }, "Bon retour, Armel"), banner ? /*#__PURE__*/React.createElement(Banner, {
    title: "\xC9coutez vos PDF pendant le trajet",
    text: "Importez un document le matin, Fish Reader le lit \xE0 voix haute sur votre t\xE9l\xE9phone.",
    action: "Me montrer comment",
    onAction: onOpenStudio,
    onClose: () => setBanner(false)
  }) : null, /*#__PURE__*/React.createElement(SectionLabel, {
    action: /*#__PURE__*/React.createElement(IconButton, {
      icon: "search",
      label: "Rechercher dans l\u2019historique"
    })
  }, "Aujourd\u2019hui"), /*#__PURE__*/React.createElement(SessionList, null, TODAY.map(s => /*#__PURE__*/React.createElement(SessionRow, _extends({
    key: s.title
  }, s)))), /*#__PURE__*/React.createElement(SectionLabel, null, "Hier"), /*#__PURE__*/React.createElement(SessionList, null, YESTERDAY.map(s => /*#__PURE__*/React.createElement(SessionRow, _extends({
    key: s.title
  }, s))))), /*#__PURE__*/React.createElement("aside", {
    className: "fr-aside"
  }, /*#__PURE__*/React.createElement(Button, {
    icon: "plus",
    size: "lg",
    onClick: onOpenStudio
  }, "Nouveau texte"), /*#__PURE__*/React.createElement(StatCard, {
    stats: [{
      value: '184,2 k',
      label: 'mots lus'
    }, {
      value: '41 h',
      label: 'd’écoute'
    }, {
      value: '23',
      label: 'jours de suite'
    }],
    goal: {
      title: 'Objectif de la semaine',
      caption: '5 heures d’écoute',
      value: 72,
      label: '3 h 36'
    }
  })));
}
Object.assign(window, {
  Accueil,
  ContinueCard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/studio/Accueil.jsx", error: String((e && e.message) || e) }); }

// ui_kits/studio/Studio.jsx
try { (() => {
const {
  IconButton: SIconButton,
  Segmented: SSegmented,
  ReaderText,
  PlayerBar
} = window.FishReaderStudioDesignSystem_d3e59a;
const CHAPTER = [['Un soir d’automne, au Chenal du Moine, le Survenant frappa à la porte des Beauchemin.', 'La pluie tombait depuis le matin, fine et têtue, sur les champs déjà nus.'], ['Didace leva les yeux de sa pipe sans rien dire.', 'L’étranger se tenait sur le seuil, grand, le chapeau ruisselant, et souriait comme quelqu’un qui revient chez lui.', 'Personne, pourtant, ne l’avait jamais vu.'], ['— Entrez, dit enfin le vieux.', 'Et la porte se referma sur la nuit.']];
const TOTAL = CHAPTER.reduce((n, p) => n + p.length, 0);
function Studio({
  theme,
  setTheme,
  onBack
}) {
  const [i, setI] = React.useState(1);
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState('1');
  React.useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setI(x => {
      if (x >= TOTAL - 1) {
        setPlaying(false);
        return x;
      }
      return x + 1;
    }), 2400 / parseFloat(speed));
    return () => clearInterval(t);
  }, [playing, speed]);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "fr-reader-top"
  }, /*#__PURE__*/React.createElement(SIconButton, {
    icon: "library",
    label: "Retour \xE0 la biblioth\xE8que",
    onClick: onBack
  }), /*#__PURE__*/React.createElement("div", {
    className: "fr-reader-doc"
  }, /*#__PURE__*/React.createElement("p", {
    className: "fr-reader-doc-title"
  }, "Le Survenant \u2014 Germaine Gu\xE8vremont"), /*#__PURE__*/React.createElement("p", {
    className: "fr-reader-doc-meta"
  }, "EPUB \xB7 Chapitre 3 sur 18")), /*#__PURE__*/React.createElement(SSegmented, {
    label: "Th\xE8me",
    value: theme,
    onChange: setTheme,
    options: [{
      value: 'light',
      label: 'Papier'
    }, {
      value: 'sepia',
      label: 'Sépia'
    }, {
      value: 'dark',
      label: 'Nuit'
    }]
  }), /*#__PURE__*/React.createElement(SIconButton, {
    icon: "bookmark",
    label: "Ajouter un signet"
  }), /*#__PURE__*/React.createElement(SIconButton, {
    icon: "more",
    label: "Plus d\u2019options"
  })), /*#__PURE__*/React.createElement("div", {
    className: "fr-reader-scroll"
  }, /*#__PURE__*/React.createElement(ReaderText, {
    kicker: "Chapitre 3",
    title: "La mar\xE9e d\u2019automne",
    paragraphs: CHAPTER,
    active: i,
    onSeek: setI
  })), /*#__PURE__*/React.createElement(PlayerBar, {
    playing: playing,
    onToggle: () => setPlaying(!playing),
    onPrev: () => setI(Math.max(0, i - 1)),
    onNext: () => setI(Math.min(TOTAL - 1, i + 1)),
    progress: Math.round((i + 1) / TOTAL * 100),
    elapsed: '14:' + String(10 + i).padStart(2, '0'),
    remaining: "\u22128:05",
    speedControl: /*#__PURE__*/React.createElement(SSegmented, {
      label: "Vitesse",
      value: speed,
      onChange: setSpeed,
      options: [{
        value: '1',
        label: '1×'
      }, {
        value: '1.25',
        label: '1,25×'
      }, {
        value: '1.5',
        label: '1,5×'
      }]
    })
  }));
}
Object.assign(window, {
  Studio
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/studio/Studio.jsx", error: String((e && e.message) || e) }); }

// ui_kits/studio/Voix.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  SearchField,
  Chip,
  VoiceCard,
  PlayerBar: VPlayerBar
} = window.FishReaderStudioDesignSystem_d3e59a;
const VOICES = [{
  name: 'Élise',
  lang: 'Français (Québec)',
  description: 'Narration posée, idéale pour les romans et les longs textes.',
  tag: {
    tone: 'accent',
    label: 'Par défaut'
  },
  k: 'qc'
}, {
  name: 'Mathieu',
  lang: 'Français (Québec)',
  description: 'Voix claire et rythmée pour les rapports et les infolettres.',
  k: 'qc'
}, {
  name: 'Rosalie',
  lang: 'Français (Québec)',
  description: 'Ton chaleureux, parfait pour les contes et la jeunesse.',
  k: 'qc'
}, {
  name: 'Antoine',
  lang: 'Français (France)',
  description: 'Voix grave et sobre, pensée pour les essais.',
  k: 'fr'
}, {
  name: 'Camille',
  lang: 'Français (France)',
  description: 'Débit rapide et net pour survoler un document.',
  tag: {
    tone: 'highlight',
    label: 'Rapide'
  },
  k: 'fr'
}, {
  name: 'Grace',
  lang: 'Anglais (Canada)',
  description: 'Calm, even narration for English documents.',
  k: 'en'
}];
function Voix() {
  const [sel, setSel] = React.useState('Élise');
  const [f, setF] = React.useState('tout');
  const [playing, setPlaying] = React.useState(false);
  const list = VOICES.filter(v => f === 'tout' || v.k === f);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "fr-main-inner",
    style: {
      flexDirection: 'column',
      alignItems: 'stretch'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "fr-h1"
  }, "Voix"), /*#__PURE__*/React.createElement("p", {
    className: "fr-lede"
  }, "Choisissez la voix qui lit vos textes. Touchez une carte pour l\u2019entendre.")), /*#__PURE__*/React.createElement(SearchField, {
    placeholder: "Rechercher une voix"
  })), /*#__PURE__*/React.createElement("div", {
    className: "fr-row",
    style: {
      marginBottom: 24
    }
  }, [['tout', 'Toutes'], ['qc', 'Québec'], ['fr', 'France'], ['en', 'Anglais']].map(c => /*#__PURE__*/React.createElement(Chip, {
    key: c[0],
    selected: f === c[0],
    onClick: () => setF(c[0])
  }, c[1]))), /*#__PURE__*/React.createElement("div", {
    className: "fr-grid"
  }, list.map((v, i) => /*#__PURE__*/React.createElement(VoiceCard, _extends({
    key: v.name
  }, v, {
    seed: i + 2,
    selected: sel === v.name,
    onSelect: () => {
      setSel(v.name);
      setPlaying(true);
    }
  }))))), /*#__PURE__*/React.createElement(VPlayerBar, {
    playing: playing,
    onToggle: () => setPlaying(!playing),
    progress: playing ? 35 : 0,
    elapsed: playing ? '0:04' : '0:00',
    remaining: "0:12",
    voice: {
      name: sel,
      sub: 'Extrait : « Bonjour, je lirai vos textes. »'
    }
  }));
}
Object.assign(window, {
  Voix
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/studio/Voix.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Banner = __ds_scope.Banner;

__ds_ns.SectionLabel = __ds_scope.SectionLabel;

__ds_ns.SessionList = __ds_scope.SessionList;

__ds_ns.SessionRow = __ds_scope.SessionRow;

__ds_ns.ICON_NAMES = __ds_scope.ICON_NAMES;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.SearchField = __ds_scope.SearchField;

__ds_ns.Segmented = __ds_scope.Segmented;

__ds_ns.AppShell = __ds_scope.AppShell;

__ds_ns.NavItem = __ds_scope.NavItem;

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.PlayerBar = __ds_scope.PlayerBar;

__ds_ns.ReaderText = __ds_scope.ReaderText;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.VoiceCard = __ds_scope.VoiceCard;

__ds_ns.Wave = __ds_scope.Wave;

})();
