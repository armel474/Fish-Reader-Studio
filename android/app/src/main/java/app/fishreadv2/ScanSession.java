package app.fishreadv2;

/** Main-thread gate: an obsolete scan must never replace a newer selection. */
final class ScanSession {
    private long generation;
    private boolean pending;

    long begin() {
        pending = true;
        return ++generation;
    }

    boolean isCurrent(long token) {
        return pending && token == generation;
    }

    boolean complete(long token) {
        if (!pending || token != generation) return false;
        pending = false;
        return true;
    }

    void cancel() {
        ++generation;
        pending = false;
    }

    boolean isPending() {
        return pending;
    }
}
