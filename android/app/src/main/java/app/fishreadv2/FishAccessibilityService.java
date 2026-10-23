package app.fishreadv2;

import android.accessibilityservice.AccessibilityService;
import android.graphics.Rect;
import android.text.TextUtils;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.accessibility.AccessibilityWindowInfo;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class FishAccessibilityService extends AccessibilityService {
    private static FishAccessibilityService instance;
    public interface ScreenListener {
        void onScreenChanged(String packageName, boolean scrolled);
    }
    private static ScreenListener screenListener;
    public static void setScreenListener(ScreenListener listener) {
        screenListener = listener;
    }
    public interface CaptureCallback {
        void onCaptured(List<ScreenBlock> blocks);
        void onFailure(String message);
    }
    private ScreenOcrScanner ocrScanner;
    private static volatile String lastCapturedScreenText = "";
    private static volatile String lastCopiedOrSelectedText = "";
    private static volatile List<ScreenBlock> lastCapturedBlocks = new ArrayList<>();
    private static final Pattern SENTENCE_SPLIT_PATTERN = Pattern.compile("(?<=[.!?…])\\s+");
    private static final Pattern SOCIAL_HEADER_PREFIX_PATTERN = Pattern.compile(
            "^(?:.{1,55}?\\b(?:Suivre|Follow|Sponsorisé|Suggested for you)\\b.{0,45}?(?:Public|Amis|Friends|\\b\\d+\\s*(?:h|min|j|sem|m|s|d)\\b)[\\s·•:\\-–—]*)+",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern PURE_TIMESTAMP_OR_COUNTER_PATTERN = Pattern.compile(
            "^(?:\\d+\\s*(?:h|min|s|j|sem|an|ans|d|w|y)|\\d+[.,]?\\d*\\s*[kKmM]?\\s*(?:J'aime|commentaires?|partages?|vues?)|[·•\\s\\d:+\\-/]+)$",
            Pattern.CASE_INSENSITIVE
    );

    public static class ScreenBlock {
        public final String text;
        public final Rect bounds;
        public final List<String> sentences;

        public ScreenBlock(String text, Rect bounds, List<String> sentences) {
            this.text = text;
            this.bounds = new Rect(bounds);
            this.sentences = sentences == null ? new ArrayList<String>() : sentences;
        }
    }

    public static FishAccessibilityService getInstance() {
        return instance;
    }

    public static String getLastCapturedScreenText() {
        return lastCapturedScreenText;
    }

    public static String getLastCopiedOrSelectedText() {
        return lastCopiedOrSelectedText;
    }

    public static void setLastCopiedOrSelectedText(String text) {
        if (text != null && text.trim().length() >= 2) {
            lastCopiedOrSelectedText = text.trim();
        }
    }

    public static List<ScreenBlock> getLastCapturedBlocks() {
        return new ArrayList<>(lastCapturedBlocks);
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
        ocrScanner = new ScreenOcrScanner(this);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        instance = this;
        if (event == null) {
            return;
        }
        CharSequence pkgChar = event.getPackageName();
        String pkg = pkgChar != null ? pkgChar.toString() : "";
        if ("app.fishreadv2".equals(pkg)) {
            return;
        }
        int eventType = event.getEventType();
        if (screenListener != null && (eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
                || eventType == AccessibilityEvent.TYPE_VIEW_SCROLLED)) {
            screenListener.onScreenChanged(pkg, eventType == AccessibilityEvent.TYPE_VIEW_SCROLLED);
        }
        if (eventType == AccessibilityEvent.TYPE_VIEW_TEXT_SELECTION_CHANGED
                || eventType == AccessibilityEvent.TYPE_VIEW_LONG_CLICKED
                || eventType == AccessibilityEvent.TYPE_VIEW_CLICKED) {
            extractSelectedOrCopiedFromEvent(event);
        }
        AccessibilityNodeInfo root = null;
        try {
            root = getRootInActiveWindow();
            if (root != null) {
                CharSequence rootPkg = root.getPackageName();
                if (rootPkg != null && "app.fishreadv2".equals(rootPkg.toString())) {
                    return;
                }
                checkSelectionInTree(root);
            }
        } catch (Throwable ignored) {
        } finally {
            if (root != null) {
                try {
                    root.recycle();
                } catch (Throwable ignored) {
                }
            }
        }
    }

    private void extractSelectedOrCopiedFromEvent(AccessibilityEvent event) {
        try {
            AccessibilityNodeInfo source = event.getSource();
            if (source != null) {
                CharSequence text = source.getText();
                if (text != null && text.length() > 1) {
                    int selStart = source.getTextSelectionStart();
                    int selEnd = source.getTextSelectionEnd();
                    if (selStart >= 0 && selEnd > selStart && selEnd <= text.length()) {
                        String selected = text.subSequence(selStart, selEnd).toString().trim();
                        if (selected.length() >= 2 && !isUiNoiseBlock(selected)) {
                            lastCopiedOrSelectedText = selected;
                        }
                    } else if (event.getEventType() == AccessibilityEvent.TYPE_VIEW_LONG_CLICKED) {
                        String cleaned = cleanSocialHeaderPrefix(text.toString());
                        if (cleaned.length() >= 8 && !isUiNoiseBlock(cleaned)) {
                            lastCopiedOrSelectedText = cleaned;
                        }
                    }
                }
                source.recycle();
            }
        } catch (Throwable ignored) {
        }
    }

    private void checkSelectionInTree(AccessibilityNodeInfo node) {
        if (node == null) {
            return;
        }
        try {
            CharSequence text = node.getText();
            if (text != null && text.length() > 1) {
                int selStart = node.getTextSelectionStart();
                int selEnd = node.getTextSelectionEnd();
                if (selStart >= 0 && selEnd > selStart && selEnd <= text.length()) {
                    String selected = text.subSequence(selStart, selEnd).toString().trim();
                    if (selected.length() >= 2 && !isUiNoiseBlock(selected)) {
                        lastCopiedOrSelectedText = selected;
                    }
                }
            }
            int childCount = node.getChildCount();
            for (int i = 0; i < childCount; i++) {
                AccessibilityNodeInfo child = node.getChild(i);
                if (child != null) {
                    checkSelectionInTree(child);
                    child.recycle();
                }
            }
        } catch (Throwable ignored) {
        }
    }

    @Override
    public void onInterrupt() {
    }

    @Override
    public void onDestroy() {
        if (instance == this) {
            instance = null;
        }
        if (ocrScanner != null) ocrScanner.close();
        super.onDestroy();
    }

    public List<ScreenBlock> captureStructuredScreenBlocks() {
        List<ScreenBlock> blocks = new ArrayList<>();
        AccessibilityNodeInfo root = null;
        try {
            root = findApplicationRoot();
            if (root != null) {
                CharSequence rootPkg = root.getPackageName();
                if (rootPkg == null || !"app.fishreadv2".equals(rootPkg.toString())) {
                    List<RawNodeBlock> rawNodes = new ArrayList<>();
                    collectRawNodes(root, rawNodes);
                    blocks = processAndSubdivideNodes(rawNodes);
                }
            }
        } catch (Throwable ignored) {
        } finally {
            if (root != null) {
                try {
                    root.recycle();
                } catch (Throwable ignored) {
                }
            }
        }
        {
            lastCapturedBlocks = new ArrayList<>(blocks);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < blocks.size(); i++) {
                if (i > 0) {
                    sb.append("\n\n");
                }
                sb.append(blocks.get(i).text);
            }
            lastCapturedScreenText = sb.toString();
        }
        return blocks;
    }

    public String captureCurrentScreenTextNow() {
        List<ScreenBlock> blocks = captureStructuredScreenBlocks();
        if (blocks.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < blocks.size(); i++) {
            if (i > 0) {
                sb.append("\n\n");
            }
            sb.append(blocks.get(i).text);
        }
        return sb.toString();
    }

    private AccessibilityNodeInfo findApplicationRoot() {
        List<AccessibilityWindowInfo> windows = getWindows();
        if (windows != null) {
            for (AccessibilityWindowInfo window : windows) {
                if (window.getType() == AccessibilityWindowInfo.TYPE_APPLICATION
                        && (window.isActive() || window.isFocused())) {
                    AccessibilityNodeInfo root = window.getRoot();
                    if (root == null) continue;
                    if (!getPackageName().contentEquals(root.getPackageName() == null ? "" : root.getPackageName())) {
                        return root;
                    }
                    root.recycle();
                }
            }
        }
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root != null && getPackageName().contentEquals(root.getPackageName() == null ? "" : root.getPackageName())) {
            root.recycle();
            return null;
        }
        return root;
    }

    public String getForegroundPackage() {
        AccessibilityNodeInfo root = findApplicationRoot();
        if (root == null) return "";
        try {
            return root.getPackageName() == null ? "" : root.getPackageName().toString();
        } finally {
            root.recycle();
        }
    }

    /** Called only after FishReader's own windows have been hidden. */
    public void captureScreen(CaptureCallback callback) {
        List<ScreenBlock> blocks = captureStructuredScreenBlocks();
        boolean coarseBounds = false;
        int height = getResources().getDisplayMetrics().heightPixels;
        for (ScreenBlock block : blocks) {
            if (block.bounds.height() > height / 3 && block.text.length() > 180) {
                coarseBounds = true;
            }
        }
        if (!blocks.isEmpty() && !coarseBounds) {
            callback.onCaptured(blocks);
            return;
        }
        if (ocrScanner == null) ocrScanner = new ScreenOcrScanner(this);
        // No fallback to a previous document when OCR fails.
        ocrScanner.capture(callback);
    }

    private static class RawNodeBlock {
        final String text;
        final Rect bounds;

        RawNodeBlock(String text, Rect bounds) {
            this.text = text;
            this.bounds = bounds;
        }
    }

    private void collectRawNodes(AccessibilityNodeInfo node, List<RawNodeBlock> out) {
        if (node == null) {
            return;
        }
        try {
            if (!node.isVisibleToUser()) {
                return;
            }
            CharSequence pkg = node.getPackageName();
            if (pkg != null && "app.fishreadv2".equals(pkg.toString())) {
                return;
            }
            Rect bounds = new Rect();
            node.getBoundsInScreen(bounds);
            Rect screen = new Rect(0, 0, getResources().getDisplayMetrics().widthPixels,
                    getResources().getDisplayMetrics().heightPixels);
            boolean validBounds = bounds.intersect(screen) && bounds.width() > 0 && bounds.height() > 0;
            String candidate = null;
            CharSequence text = node.getText();
            CharSequence desc = node.getContentDescription();
            if (text != null && text.toString().trim().length() > 0) {
                candidate = text.toString().trim();
            } else if (desc != null && desc.toString().trim().length() > 28) {
                candidate = desc.toString().trim();
            }
            if (candidate != null && validBounds) {
                String cleaned = cleanSocialHeaderPrefix(candidate);
                if (!isUiNoiseBlock(cleaned)) {
                    out.add(new RawNodeBlock(cleaned, bounds));
                }
            }
            int childCount = node.getChildCount();
            for (int i = 0; i < childCount; i++) {
                AccessibilityNodeInfo child = node.getChild(i);
                if (child != null) {
                    collectRawNodes(child, out);
                    child.recycle();
                }
            }
        } catch (Throwable ignored) {
        }
    }

    private List<ScreenBlock> processAndSubdivideNodes(List<RawNodeBlock> rawNodes) {
        Collections.sort(rawNodes, new Comparator<RawNodeBlock>() {
            @Override
            public int compare(RawNodeBlock a, RawNodeBlock b) {
                int dy = Integer.compare(a.bounds.top, b.bounds.top);
                return dy != 0 ? dy : Integer.compare(a.bounds.left, b.bounds.left);
            }
        });

        List<RawNodeBlock> deduped = new ArrayList<>();
        for (int i = 0; i < rawNodes.size(); i++) {
            RawNodeBlock candidate = rawNodes.get(i);
            String normCand = normalizeForDedup(candidate.text);
            if (normCand.length() < 8) {
                continue;
            }
            boolean handled = false;
            for (int j = 0; j < deduped.size(); j++) {
                String normExist = normalizeForDedup(deduped.get(j).text);
                if (!Rect.intersects(candidate.bounds, deduped.get(j).bounds)) continue;
                if (normExist.equals(normCand) || normExist.contains(normCand)) {
                    handled = true;
                    break;
                }
                if (normCand.contains(normExist) && normCand.length() > normExist.length() + 15) {
                    deduped.set(j, candidate);
                    handled = true;
                    break;
                }
            }
            if (!handled) {
                deduped.add(candidate);
            }
        }

        List<ScreenBlock> result = new ArrayList<>();
        Set<String> seenParagraphNorms = new LinkedHashSet<>();

        for (int i = 0; i < deduped.size(); i++) {
            RawNodeBlock block = deduped.get(i);
            String text = block.text.trim();
            String norm = normalizeForDedup(text);
            if (seenParagraphNorms.add(norm + "@" + block.bounds.flattenToString())) {
                List<String> sentences = splitIntoSentences(text);
                if (!sentences.isEmpty()) result.add(new ScreenBlock(text, block.bounds, sentences));
            }
        }
        return result;
    }

    public static String normalizeForDedup(String s) {
        if (s == null) {
            return "";
        }
        return s.toLowerCase().replaceAll("[^\\p{L}\\p{N}]+", " ").trim();
    }

    public static String cleanSocialHeaderPrefix(String raw) {
        if (raw == null) {
            return "";
        }
        String text = raw.replace('\u00A0', ' ').trim();
        Matcher m = SOCIAL_HEADER_PREFIX_PATTERN.matcher(text);
        if (m.find()) {
            text = text.substring(m.end()).trim();
        }
        text = text.replaceAll("^(?:Suivre|Follow|Partagé avec Public|Shared with Public|Sponsorisé|Public)[\\s·•:\\-–—]+", "").trim();
        text = text.replaceAll("\\s*(?:…\\s*Voir plus|\\.\\.\\.\\s*Voir plus|Afficher la suite|See more|En savoir plus)\\s*$", "").trim();
        return text;
    }

    public static boolean isUiNoiseBlock(String text) {
        if (text == null) {
            return true;
        }
        String t = text.trim();
        if (t.length() < 6) {
            return true;
        }
        if (PURE_TIMESTAMP_OR_COUNTER_PATTERN.matcher(t).matches()) {
            return true;
        }
        String lower = t.toLowerCase();
        String[] exactNoise = new String[]{
                "j'aime", "commenter", "partager", "envoyer", "suivre", "s'abonner",
                "rechercher", "accueil", "notifications", "menu", "profil", "amis",
                "reels", "watch", "marketplace", "écrire un commentaire…",
                "écrire un commentaire...", "voir plus", "voir la traduction",
                "afficher l'original", "partagé avec public", "sponsorisé",
                "fish reader", "lire", "pause", "stop", "texte copié"
        };
        for (String noise : exactNoise) {
            if (lower.equals(noise)) {
                return true;
            }
        }
        if (t.length() < 95 && ((lower.contains("suivre") && (lower.contains("public") || lower.contains(" h ") || lower.contains(" min")))
                || lower.contains("partagé avec public")
                || lower.contains("j'aime · commenter")
                || lower.contains("écrire un commentaire"))) {
            return true;
        }
        int letters = 0;
        for (int i = 0; i < t.length(); i++) {
            if (Character.isLetter(t.charAt(i))) {
                letters++;
            }
        }
        return letters < 4;
    }

    public static List<String> splitIntoSentences(String paragraph) {
        List<String> out = new ArrayList<>();
        if (TextUtils.isEmpty(paragraph)) {
            return out;
        }
        String normalized = paragraph.replaceAll("\\s+", " ").trim();
        if (normalized.isEmpty()) {
            return out;
        }
        String[] parts = SENTENCE_SPLIT_PATTERN.split(normalized);
        for (String part : parts) {
            String trimmed = part.trim();
            if (trimmed.length() >= 2) {
                out.add(trimmed);
            }
        }
        if (out.isEmpty() && normalized.length() >= 2) {
            out.add(normalized);
        }
        return out;
    }
}

