package app.fishreadv2;

/** Native equivalents of the original Claude Design Papier/Sépia/Nuit tokens. */
final class ReaderTheme {
    final String paper, surface, ink, muted, rule, accent, onAccent;
    private ReaderTheme(String paper, String surface, String ink, String muted,
                        String rule, String accent, String onAccent) {
        this.paper = paper; this.surface = surface; this.ink = ink; this.muted = muted;
        this.rule = rule; this.accent = accent; this.onAccent = onAccent;
    }
    static ReaderTheme forId(String id) {
        if ("sepia".equals(id)) return new ReaderTheme("#EFE3CC", "#F6ECD9", "#3B2F22", "#6A5843", "#D9C7A6", "#1D5458", "#FFFCF5");
        if ("nuit".equals(id)) return new ReaderTheme("#1C1A17", "#26231F", "#ECE4D6", "#A89E8F", "#3A352E", "#7FB8B3", "#1C1A17");
        return new ReaderTheme("#F7F2E8", "#FFFCF5", "#2A241D", "#6B6155", "#E2D8C6", "#1F5F63", "#FFFCF5");
    }
}
