package app.fishreadv2;

/** Regression scenarios for asynchronous capture completion and cancellation. */
public final class ScanSessionTest {
    private static void check(boolean value, String scenario) {
        if (!value) throw new AssertionError(scenario);
    }

    public static void main(String[] args) {
        ScanSession session = new ScanSession();
        long word = session.begin();
        long facebook = session.begin();
        check(!session.complete(word), "Late Word scan must not replace Facebook");
        check(session.isPending(), "Rejecting Word must preserve Facebook request");
        check(session.complete(facebook), "Newest scan can display its selection");
        check(!session.complete(facebook), "One scan cannot complete twice");
        long manus = session.begin();
        session.cancel();
        check(!session.complete(manus), "Stop or app switch discards OCR in flight");
        long timedOut = session.begin();
        check(session.complete(timedOut), "Timeout can finish a pending capture");
        long retry = session.begin();
        check(!session.complete(timedOut), "Late OCR after timeout cannot finish retry");
        check(session.isCurrent(retry), "Retry remains current");
        session.cancel();
        check(!session.isCurrent(retry), "Delayed capture must not start after cancellation");
        check(!session.isPending(), "Cancelled scan leaves no pending selection");
        System.out.println("10 scan-session regression assertions passed");
    }
}
