package app.fishreadv2;

import java.util.Arrays;

public final class ReadingSessionTest {
    private static void check(boolean value, String scenario) {
        if (!value) throw new AssertionError(scenario);
    }
    public static void main(String[] args) {
        ReadingSession session = new ReadingSession();
        String word = "word|12|Document A";
        check(!session.follows(word, true), "Enabling the preference must not arm global scanning");
        session.load(word);
        check(session.hasDocument(), "A successful scan makes commands available");
        check(!session.follows(word, true), "A scan alone must not start scroll playback");
        session.play();
        check(session.follows(word, true), "Explicit playback arms follow in the same document");
        check(!session.follows(word, false), "Preference off disables follow");
        check(!session.follows("launcher|13|Home", true), "Home scroll cannot trigger a capture");
        check(!session.follows("word|12|Document B", true), "Another document in the same app is excluded");
        check(!session.follows("word|14|Document A", true), "A different window is excluded");
        session.sentenceCompleted("Déjà lu.");
        check(session.firstUnread(Arrays.asList("  DÉJÀ  LU. ", "Nouveau.", "Déjà lu.")) == 1,
                "Skip the leading overlap without skipping a repeated passage later");
        check(session.firstUnread(Arrays.asList("Déjà lu.")) == 1, "No new text means no automatic replay");
        check(session.firstUnread(Arrays.asList("Phrase partielle", "Nouveau.")) == 0,
                "Uncertain OCR overlap is not silently omitted");
        session.chooseStart();
        check(session.firstUnread(Arrays.asList("Déjà lu.")) == 0, "Choosing a new starting point allows an intentional reread");
        session.pause();
        check(session.hasDocument(), "Pause/stop keeps commands for the loaded document");
        check(!session.follows(word, true), "Scrolling while paused cannot restart audio");
        session.load("meta|22|Conversation");
        check(session.firstUnread(Arrays.asList("Déjà lu.")) == 0, "Manual new scan clears overlap history");
        session.load(""); session.play();
        check(!session.follows("", true), "Clipboard text cannot arm screen scanning");
        session.clear();
        check(!session.hasDocument(), "Leaving the document returns to initial scan behavior");
        System.out.println("17 reading-session regression assertions passed");
    }
}
