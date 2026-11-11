package app.fishreadv2;

import java.text.Normalizer;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** Reading intent belongs to one explicitly selected application window/document. */
final class ReadingSession {
    private boolean loaded;
    private boolean following;
    private String scope = "";
    private final Set<String> completed = new LinkedHashSet<>();

    void load(String documentScope) {
        clear();
        loaded = true;
        scope = documentScope == null ? "" : documentScope;
    }

    boolean hasDocument() { return loaded; }
    boolean matches(String candidate) { return loaded && !scope.isEmpty() && scope.equals(candidate); }
    boolean hasScreenSource() { return loaded && !scope.isEmpty(); }
    void play() { if (loaded) following = true; }
    void chooseStart() { if (loaded) { completed.clear(); following = true; } }
    void pause() { following = false; }
    boolean follows(String candidate, boolean enabled) { return enabled && following && matches(candidate); }

    void clear() {
        loaded = false;
        following = false;
        scope = "";
        completed.clear();
    }

    void sentenceCompleted(String sentence) {
        if (!loaded) return;
        completed.add(normalize(sentence));
        if (completed.size() > 1000) completed.remove(completed.iterator().next());
    }

    /** Skip only an already-heard leading overlap, never a later repeated passage. */
    int firstUnread(List<String> visible) {
        int index = 0;
        while (index < visible.size() && completed.contains(normalize(visible.get(index)))) index++;
        return index;
    }

    private static String normalize(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFC)
                .replace('\u00a0', ' ').replaceAll("\\s+", " ").trim().toLowerCase(Locale.ROOT);
    }
}
