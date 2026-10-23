package app.fishreadv2;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;

public class FishVoiceEngine {
    private static final String PREFS_NAME = "fish_reader_prefs";
    private static final String KEY_VOICE_ID = "selected_voice_id";
    private static final String KEY_SPEED_MULT = "speed_multiplier";

    public static class VoiceSpec {
        public final String id;
        public final String label;
        public final String subtitle;
        public final String gender;
        public final int variantIndex;
        public final float fallbackPitch;
        public final float rateFactor;
        public final long sentencePauseMs;

        public VoiceSpec(String id, String label, String subtitle, String gender, int variantIndex, float fallbackPitch, float rateFactor, long sentencePauseMs) {
            this.id = id;
            this.label = label;
            this.subtitle = subtitle;
            this.gender = gender;
            this.variantIndex = variantIndex;
            this.fallbackPitch = fallbackPitch;
            this.rateFactor = rateFactor;
            this.sentencePauseMs = sentencePauseMs;
        }
    }

    public static final VoiceSpec[] VOICES = new VoiceSpec[]{
            new VoiceSpec("fr-clara", "1/4 · Clara (Femme Douce)", "Voix 1/4 · Féminine douce & posée · Constante sur tous les §", "female", 0, 1.02f, 1.0f, 95L),
            new VoiceSpec("fr-thomas", "2/4 · Thomas (Homme Grave)", "Voix 2/4 · Masculine baryton grave · Constante sur tous les §", "male", 0, 0.74f, 0.96f, 105L),
            new VoiceSpec("fr-nicolas", "3/4 · Nicolas (Homme Clair)", "Voix 3/4 · Masculine ténor claire · Constante sur tous les §", "male", 1, 0.87f, 1.02f, 90L),
            new VoiceSpec("fr-emma", "4/4 · Emma (Femme Vive)", "Voix 4/4 · Féminine vive & cristalline · Constante sur tous les §", "female", 1, 1.16f, 1.03f, 90L)
    };

    public interface PlaybackListener {
        default void onPlaybackError(String message) {}
        void onStateChanged(boolean isPlaying, boolean isLoading, int currentSentenceIndex, int totalSentences, String currentSentence, String activeVoiceLabel, float speedMultiplier, int activeParagraphIndex);
    }

    private static final CopyOnWriteArrayList<FishVoiceEngine> sActiveInstances = new CopyOnWriteArrayList<>();
    private static volatile VoiceSpec sGlobalSelectedVoice = VOICES[0];
    private static volatile float sGlobalSpeedMultiplier = 1.0f;

    private final Context context;
    private final SharedPreferences prefs;
    private PlaybackListener listener;
    private TextToSpeech systemTts;
    private volatile boolean systemTtsReady = false;
    private long ttsWaitStartedAt;
    private VoiceSpec selectedVoice = VOICES[0];
    private float speedMultiplier = 1.0f;
    private final Map<String, Voice> lockedAndroidVoices = new HashMap<>();
    private String[] sentences = new String[0];
    private int[] sentenceParagraphIndices = new int[0];
    private int currentIndex = 0;
    private volatile boolean isPlaying = false;
    private volatile boolean isLoading = false;
    private volatile int playbackGeneration = 0;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    public FishVoiceEngine(Context context) {
        this.context = context.getApplicationContext();
        this.prefs = this.context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        loadSavedSettings();
        sActiveInstances.add(this);
        initSystemTts();
    }

    private static VoiceSpec resolveVoiceSpecById(String voiceId) {
        if (voiceId == null) {
            return VOICES[0];
        }
        String lower = voiceId.trim().toLowerCase(Locale.ROOT);
        for (int i = 0; i < VOICES.length; i++) {
            if (VOICES[i].id.equalsIgnoreCase(lower)) {
                return VOICES[i];
            }
        }
        if (lower.contains("thomas") || lower.contains("tom") || lower.contains("homme-1") || lower.contains("2/4")) {
            return VOICES[1];
        }
        if (lower.contains("nicolas") || lower.contains("homme-2") || lower.contains("3/4")) {
            return VOICES[2];
        }
        if (lower.contains("emma") || lower.contains("femme-2") || lower.contains("4/4")) {
            return VOICES[3];
        }
        return VOICES[0];
    }

    private void loadSavedSettings() {
        VoiceSpec resolved = resolveVoiceSpecById(this.prefs.getString(KEY_VOICE_ID, VOICES[0].id));
        this.selectedVoice = resolved;
        sGlobalSelectedVoice = resolved;
        float speed = this.prefs.getFloat(KEY_SPEED_MULT, 1.0f);
        if (speed < 0.7f || speed > 2.2f) {
            speed = 1.0f;
        }
        this.speedMultiplier = speed;
        sGlobalSpeedMultiplier = speed;
    }

    private VoiceSpec syncLockedVoiceFromPrefs() {
        String id = this.prefs.getString(KEY_VOICE_ID, null);
        VoiceSpec resolved = id != null ? resolveVoiceSpecById(id) : sGlobalSelectedVoice;
        if (resolved == null) {
            resolved = VOICES[0];
        }
        this.selectedVoice = resolved;
        sGlobalSelectedVoice = resolved;
        return resolved;
    }

    private float syncSpeedFromPrefs() {
        float speed = this.prefs.getFloat(KEY_SPEED_MULT, sGlobalSpeedMultiplier);
        if (speed < 0.7f || speed > 2.2f) {
            speed = 1.0f;
        }
        this.speedMultiplier = speed;
        sGlobalSpeedMultiplier = speed;
        return speed;
    }

    private void initSystemTts() {
        try {
            this.systemTts = new TextToSpeech(this.context, new TextToSpeech.OnInitListener() {
                @Override
                public void onInit(int status) {
                    if (status == TextToSpeech.SUCCESS && FishVoiceEngine.this.systemTts != null) {
                        try {
                            int res = FishVoiceEngine.this.systemTts.setLanguage(new Locale("fr", "CA"));
                            if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                                FishVoiceEngine.this.systemTts.setLanguage(Locale.FRANCE);
                            }
                        } catch (Throwable ignored) {
                        }
                        FishVoiceEngine.this.attachUtteranceListener();
                        FishVoiceEngine.this.lockedAndroidVoices.clear();
                        FishVoiceEngine.this.systemTtsReady = true;
                        FishVoiceEngine.this.applyDistinctFrenchVoice(FishVoiceEngine.this.syncLockedVoiceFromPrefs());
                        if (FishVoiceEngine.this.isPlaying && FishVoiceEngine.this.sentences.length > 0) {
                            FishVoiceEngine.this.speakCurrentSentence();
                        }
                    }
                }
            });
        } catch (Throwable ignored) {
        }
    }

    private void attachUtteranceListener() {
        if (this.systemTts == null) {
            return;
        }
        this.systemTts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override
            public void onStart(String utteranceId) {
                final int gen = FishVoiceEngine.this.parseGenFromUtterance(utteranceId);
                FishVoiceEngine.this.mainHandler.post(new Runnable() {
                    @Override
                    public void run() {
                        if (gen == FishVoiceEngine.this.playbackGeneration) {
                            FishVoiceEngine.this.isLoading = false;
                            FishVoiceEngine.this.notifyState();
                        }
                    }
                });
            }

            @Override
            public void onDone(String utteranceId) {
                final int gen = FishVoiceEngine.this.parseGenFromUtterance(utteranceId);
                FishVoiceEngine.this.mainHandler.post(new Runnable() {
                    @Override
                    public void run() {
                        if (gen == FishVoiceEngine.this.playbackGeneration && FishVoiceEngine.this.isPlaying) {
                            FishVoiceEngine.this.advanceToNextSentence(gen);
                        }
                    }
                });
            }

            @Override
            public void onError(String utteranceId) {
                final int gen = FishVoiceEngine.this.parseGenFromUtterance(utteranceId);
                FishVoiceEngine.this.mainHandler.post(new Runnable() {
                    @Override
                    public void run() {
                        if (gen == FishVoiceEngine.this.playbackGeneration && FishVoiceEngine.this.isPlaying) {
                            FishVoiceEngine.this.failPlayback("La synthèse vocale a échoué. Vérifiez la voix installée puis réessayez.");
                        }
                    }
                });
            }
        });
    }

    private int parseGenFromUtterance(String utteranceId) {
        if (utteranceId == null) {
            return -1;
        }
        try {
            int secondUnderscore = utteranceId.indexOf('_', 4);
            if (secondUnderscore < 0) {
                secondUnderscore = utteranceId.indexOf('_');
            }
            if (secondUnderscore > 4 && utteranceId.startsWith("utt_")) {
                return Integer.parseInt(utteranceId.substring(4, secondUnderscore));
            }
        } catch (Throwable ignored) {
        }
        return -1;
    }

    private boolean applyDistinctFrenchVoice(VoiceSpec spec) {
        if (this.systemTts == null || !this.systemTtsReady || spec == null) {
            return false;
        }
        try {
            if (Build.VERSION.SDK_INT >= 21) {
                Voice cached = this.lockedAndroidVoices.get(spec.id);
                if (cached != null) {
                    if (this.systemTts.setVoice(cached) == TextToSpeech.SUCCESS) return true;
                    this.lockedAndroidVoices.remove(spec.id);
                }
                Set<Voice> allVoices = this.systemTts.getVoices();
                if (allVoices != null && !allVoices.isEmpty()) {
                    List<Voice> localMale = new ArrayList<>();
                    List<Voice> localFemale = new ArrayList<>();
                    List<Voice> localAll = new ArrayList<>();
                    List<Voice> netMale = new ArrayList<>();
                    List<Voice> netFemale = new ArrayList<>();
                    List<Voice> netAll = new ArrayList<>();

                    for (Voice v : allVoices) {
                        if (v != null && v.getLocale() != null) {
                            String lang = v.getLocale().getLanguage();
                            if (lang != null && lang.toLowerCase(Locale.ROOT).startsWith("fr")) {
                                String name = v.getName() != null ? v.getName().toLowerCase(Locale.ROOT) : "";
                                Set<String> features = v.getFeatures();
                                String featStr = features != null ? features.toString().toLowerCase(Locale.ROOT) : "";
                                boolean isNetwork = v.isNetworkConnectionRequired() || name.contains("network");
                                if (features != null && features.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
                                boolean isMale = (name.contains("male") && !name.contains("female"))
                                        || name.contains("-frd") || name.contains("-frb")
                                        || name.contains("thomas") || name.contains("nicolas")
                                        || name.contains("paul") || name.contains("henri")
                                        || name.contains("antoine") || name.contains("jerome")
                                        || name.contains("gilles") || name.contains("iom")
                                        || (featStr.contains("male") && !featStr.contains("female"));
                                boolean isFemale = name.contains("female")
                                        || name.contains("-fra") || name.contains("-frc") || name.contains("-fre")
                                        || name.contains("clara") || name.contains("emma")
                                        || name.contains("marie") || name.contains("julie")
                                        || name.contains("amelie") || name.contains("celine")
                                        || name.contains("hortense") || name.contains("audrey")
                                        || name.contains("siri") || featStr.contains("female");

                                if (!isNetwork) {
                                    localAll.add(v);
                                    if (isMale) {
                                        localMale.add(v);
                                    } else if (isFemale) {
                                        localFemale.add(v);
                                    }
                                } else {
                                    netAll.add(v);
                                    if (isMale) {
                                        netMale.add(v);
                                    } else if (isFemale) {
                                        netFemale.add(v);
                                    }
                                }
                            }
                        }
                    }

                    Comparator<Voice> byName = new Comparator<Voice>() {
                        @Override
                        public int compare(Voice a, Voice b) {
                            String na = a.getName() != null ? a.getName() : "";
                            String nb = b.getName() != null ? b.getName() : "";
                            return na.compareTo(nb);
                        }
                    };
                    Collections.sort(localMale, byName);
                    Collections.sort(localFemale, byName);
                    Collections.sort(localAll, byName);
                    Collections.sort(netMale, byName);
                    Collections.sort(netFemale, byName);
                    Collections.sort(netAll, byName);

                    boolean wantsMale = "male".equalsIgnoreCase(spec.gender);
                    List<Voice> primaryPool = wantsMale ? localMale : localFemale;
                    List<Voice> pool = primaryPool;

                    Voice chosen = null;
                    if (!pool.isEmpty()) {
                        int idx = Math.max(0, Math.min(spec.variantIndex, pool.size() - 1));
                        chosen = pool.get(idx);
                    } else if (!localAll.isEmpty()) {
                        chosen = localAll.get(0);
                    }

                    if (chosen != null) {
                        if (this.systemTts.setVoice(chosen) == TextToSpeech.SUCCESS) {
                            this.lockedAndroidVoices.put(spec.id, chosen);
                            return true;
                        }
                    }
                }
            }
        } catch (Throwable ignored) {
        }
        return false;
    }

    public void setListener(PlaybackListener listener) {
        this.listener = listener;
        syncLockedVoiceFromPrefs();
        syncSpeedFromPrefs();
        notifyState();
    }

    public VoiceSpec getSelectedVoice() {
        return syncLockedVoiceFromPrefs();
    }

    public void setSelectedVoiceById(String voiceId) {
        VoiceSpec resolved = resolveVoiceSpecById(voiceId);
        this.selectedVoice = resolved;
        sGlobalSelectedVoice = resolved;
        this.prefs.edit().putString(KEY_VOICE_ID, resolved.id).apply();
        for (FishVoiceEngine engine : sActiveInstances) {
            if (engine != null) {
                engine.selectedVoice = resolved;
                engine.applyDistinctFrenchVoice(resolved);
                if (engine != this) {
                    engine.notifyState();
                }
            }
        }
        if (this.isPlaying && this.sentences.length > 0) {
            speakCurrentSentence();
        } else {
            notifyState();
        }
    }

    public float getSpeedMultiplier() {
        return syncSpeedFromPrefs();
    }

    public int getCurrentWpm() {
        return Math.round(155.0f * syncSpeedFromPrefs());
    }

    public void setSpeedMultiplier(float multiplier) {
        float clamped = Math.max(0.75f, Math.min(2.0f, multiplier));
        this.speedMultiplier = clamped;
        sGlobalSpeedMultiplier = clamped;
        this.prefs.edit().putFloat(KEY_SPEED_MULT, clamped).apply();
        for (FishVoiceEngine engine : sActiveInstances) {
            if (engine != null) {
                engine.speedMultiplier = clamped;
                if (engine != this) {
                    engine.notifyState();
                }
            }
        }
        if (this.isPlaying && this.sentences.length > 0) {
            speakCurrentSentence();
        } else {
            notifyState();
        }
    }

    public boolean isPlaying() {
        return this.isPlaying;
    }

    public int getCurrentIndex() {
        return this.currentIndex;
    }

    public int getTotalSentences() {
        return this.sentences.length;
    }

    public int getCurrentParagraphIndex() {
        if (this.sentenceParagraphIndices == null || this.sentenceParagraphIndices.length == 0) {
            return -1;
        }
        if (this.currentIndex < 0 || this.currentIndex >= this.sentenceParagraphIndices.length) {
            return this.sentenceParagraphIndices[0];
        }
        return this.sentenceParagraphIndices[this.currentIndex];
    }

    public void speakBlocksFromParagraph(List<FishAccessibilityService.ScreenBlock> blocks, int startParagraphIndex) {
        if (blocks == null || blocks.isEmpty()) {
            return;
        }
        stopOtherInstances();
        syncLockedVoiceFromPrefs();
        syncSpeedFromPrefs();
        int safeStartPara = Math.max(0, Math.min(startParagraphIndex, blocks.size() - 1));
        List<String> flatSentences = new ArrayList<>();
        List<Integer> flatParaIndices = new ArrayList<>();
        int startSentenceIdx = 0;

        for (int p = 0; p < blocks.size(); p++) {
            if (p == safeStartPara) {
                startSentenceIdx = flatSentences.size();
            }
            FishAccessibilityService.ScreenBlock block = blocks.get(p);
            List<String> sents = block.sentences;
            if (sents == null || sents.isEmpty()) {
                sents = FishAccessibilityService.splitIntoSentences(block.text);
            }
            for (int s = 0; s < sents.size(); s++) {
                String line = sents.get(s);
                if (line != null && !line.trim().isEmpty()) {
                    flatSentences.add(line.trim());
                    flatParaIndices.add(p);
                }
            }
        }

        if (!flatSentences.isEmpty()) {
            this.playbackGeneration++;
            if (this.systemTts != null) {
                try {
                    this.systemTts.stop();
                } catch (Throwable ignored) {
                }
            }
            this.sentences = flatSentences.toArray(new String[0]);
            this.sentenceParagraphIndices = new int[flatParaIndices.size()];
            for (int i = 0; i < flatParaIndices.size(); i++) {
                this.sentenceParagraphIndices[i] = flatParaIndices.get(i);
            }
            this.currentIndex = Math.max(0, Math.min(startSentenceIdx, this.sentences.length - 1));
            this.isPlaying = true;
            this.isLoading = false;
            speakCurrentSentence();
        }
    }

    public void speakText(String rawText) {
        if (rawText == null || rawText.trim().isEmpty()) {
            return;
        }
        syncLockedVoiceFromPrefs();
        syncSpeedFromPrefs();
        stopOtherInstances();
        String cleaned = FishAccessibilityService.cleanSocialHeaderPrefix(rawText.trim());
        String effective = cleaned.isEmpty() ? rawText.trim() : cleaned;
        String[] paragraphs = effective.split("\\n\\s*\\n|\\n");
        List<String> flatSentences = new ArrayList<>();
        List<Integer> flatParaIndices = new ArrayList<>();
        int pIdx = 0;
        for (String para : paragraphs) {
            String trimmed = para.trim();
            if (trimmed.length() >= 2) {
                List<String> sents = FishAccessibilityService.splitIntoSentences(trimmed);
                for (int i = 0; i < sents.size(); i++) {
                    flatSentences.add(sents.get(i));
                    flatParaIndices.add(pIdx);
                }
                pIdx++;
            }
        }
        if (flatSentences.isEmpty()) {
            flatSentences.add(effective);
            flatParaIndices.add(0);
        }
        this.playbackGeneration++;
        if (this.systemTts != null) {
            try {
                this.systemTts.stop();
            } catch (Throwable ignored) {
            }
        }
        this.sentences = flatSentences.toArray(new String[0]);
        this.sentenceParagraphIndices = new int[flatParaIndices.size()];
        for (int i = 0; i < flatParaIndices.size(); i++) {
            this.sentenceParagraphIndices[i] = flatParaIndices.get(i);
        }
        this.currentIndex = 0;
        this.isPlaying = true;
        this.isLoading = false;
        speakCurrentSentence();
    }

    private void stopOtherInstances() {
        for (FishVoiceEngine engine : sActiveInstances) {
            if (engine != this) engine.stopAndClear();
        }
    }

    public void togglePlayPause() {
        if (this.sentences.length == 0) {
            return;
        }
        if (this.isPlaying) {
            pause();
        } else {
            resume();
        }
    }

    public void pause() {
        this.playbackGeneration++;
        this.isPlaying = false;
        this.isLoading = false;
        if (this.systemTts != null) {
            try {
                this.systemTts.stop();
            } catch (Throwable ignored) {
            }
        }
        notifyState();
    }

    public void resume() {
        if (this.sentences.length == 0) {
            return;
        }
        syncLockedVoiceFromPrefs();
        syncSpeedFromPrefs();
        if (this.currentIndex < 0 || this.currentIndex >= this.sentences.length) {
            this.currentIndex = 0;
        }
        this.isPlaying = true;
        speakCurrentSentence();
    }

    public void stopAndClear() {
        this.playbackGeneration++;
        this.isPlaying = false;
        this.isLoading = false;
        this.currentIndex = 0;
        this.sentences = new String[0];
        this.sentenceParagraphIndices = new int[0];
        if (this.systemTts != null) {
            try {
                this.systemTts.stop();
            } catch (Throwable ignored) {
            }
        }
        notifyState();
    }

    public void stop() {
        stopAndClear();
    }

    public void nextSentence() {
        if (this.sentences.length != 0 && this.currentIndex < this.sentences.length - 1) {
            this.currentIndex++;
            if (this.isPlaying) {
                speakCurrentSentence();
            } else {
                notifyState();
            }
        }
    }

    public void previousSentence() {
        if (this.sentences.length != 0 && this.currentIndex > 0) {
            this.currentIndex--;
            if (this.isPlaying) {
                speakCurrentSentence();
            } else {
                notifyState();
            }
        }
    }

    private void advanceToNextSentence(final int gen) {
        if (gen == this.playbackGeneration && this.isPlaying) {
            if (this.currentIndex < this.sentences.length - 1) {
                long basePause = this.selectedVoice != null ? this.selectedVoice.sentencePauseMs : 95L;
                long delayMs = Math.max(45L, Math.round(basePause / Math.max(0.8f, this.speedMultiplier)));
                this.mainHandler.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        if (gen == FishVoiceEngine.this.playbackGeneration && FishVoiceEngine.this.isPlaying) {
                            FishVoiceEngine.this.currentIndex++;
                            FishVoiceEngine.this.speakCurrentSentence();
                        }
                    }
                }, delayMs);
                return;
            }
            stopAndClear();
        }
    }

    private void speakCurrentSentence() {
        if (!this.isPlaying || this.sentences.length == 0) {
            return;
        }
        if (this.currentIndex < 0 || this.currentIndex >= this.sentences.length) {
            this.isPlaying = false;
            this.isLoading = false;
            notifyState();
            return;
        }
        syncLockedVoiceFromPrefs();
        syncSpeedFromPrefs();
        final int gen = ++this.playbackGeneration;
        String sentence = this.sentences[this.currentIndex];
        this.isLoading = true;
        this.ttsWaitStartedAt = SystemClock.uptimeMillis();
        notifyState();
        speakWithSystemTtsNow(sentence, gen);
    }

    private static String normalizeSentenceForConstantVoice(String sentence) {
        if (sentence == null) {
            return "";
        }
        return sentence.trim()
                .replace('«', ' ')
                .replace('»', ' ')
                .replace('"', ' ')
                .replace('“', ' ')
                .replace('”', ' ')
                .replace('•', ',')
                .replace('·', ',')
                .replace('—', ',')
                .replace('–', ',')
                .replaceAll("https?://\\S+", "lien web")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private void speakWithSystemTtsNow(final String sentence, final int gen) {
        this.mainHandler.post(new Runnable() {
            @Override
            public void run() {
                if (gen != FishVoiceEngine.this.playbackGeneration || !FishVoiceEngine.this.isPlaying) {
                    return;
                }
                if (FishVoiceEngine.this.systemTts == null || !FishVoiceEngine.this.systemTtsReady) {
                    if (SystemClock.uptimeMillis() - FishVoiceEngine.this.ttsWaitStartedAt > 8000L) {
                        FishVoiceEngine.this.failPlayback("Le moteur vocal ne répond pas. Vérifiez les voix hors ligne dans les paramètres Android.");
                        return;
                    }
                    FishVoiceEngine.this.mainHandler.postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            if (gen == FishVoiceEngine.this.playbackGeneration && FishVoiceEngine.this.isPlaying) {
                                FishVoiceEngine.this.speakWithSystemTtsNow(sentence, gen);
                            }
                        }
                    }, 250L);
                    return;
                }
                try {
                    VoiceSpec voice = FishVoiceEngine.this.syncLockedVoiceFromPrefs();
                    float speed = FishVoiceEngine.this.syncSpeedFromPrefs();
                    if (!FishVoiceEngine.this.applyDistinctFrenchVoice(voice)) {
                        FishVoiceEngine.this.failPlayback("Aucune voix française hors ligne disponible. Installez-en une dans les paramètres de synthèse vocale Android.");
                        return;
                    }
                    // Preserve the installed voice's natural pitch; changing speed must not fake a gender.
                    FishVoiceEngine.this.systemTts.setPitch(1.0f);
                    float effectiveRate = Math.max(0.65f, Math.min(2.2f, voice.rateFactor * speed));
                    FishVoiceEngine.this.systemTts.setSpeechRate(effectiveRate);
                    String normalized = normalizeSentenceForConstantVoice(sentence);
                    if (normalized.isEmpty()) {
                        normalized = sentence;
                    }
                    String uttId = "utt_" + gen + "_" + FishVoiceEngine.this.currentIndex;
                    if (Build.VERSION.SDK_INT >= 21) {
                        Bundle params = new Bundle();
                        params.putString("networkTts", "false");
                        int status = FishVoiceEngine.this.systemTts.speak(normalized, TextToSpeech.QUEUE_FLUSH, params, uttId);
                        if (status == TextToSpeech.ERROR) FishVoiceEngine.this.failPlayback("Le moteur vocal a refusé cette lecture.");
                    } else {
                        HashMap<String, String> params = new HashMap<>();
                        params.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, uttId);
                        params.put("networkTts", "false");
                        FishVoiceEngine.this.systemTts.speak(normalized, TextToSpeech.QUEUE_FLUSH, params);
                    }
                } catch (Throwable ignored) {
                    FishVoiceEngine.this.failPlayback("Impossible de lancer la synthèse vocale.");
                }
            }
        });
    }

    private void failPlayback(String message) {
        pause();
        if (listener != null) listener.onPlaybackError(message);
        else android.widget.Toast.makeText(context, message, android.widget.Toast.LENGTH_LONG).show();
    }

    private void notifyState() {
        if (this.listener == null) {
            return;
        }
        final String currentSent = (this.sentences.length > 0 && this.currentIndex >= 0 && this.currentIndex < this.sentences.length)
                ? this.sentences[this.currentIndex]
                : "";
        final int activePara = getCurrentParagraphIndex();
        final VoiceSpec activeVoice = this.selectedVoice != null ? this.selectedVoice : VOICES[0];
        this.mainHandler.post(new Runnable() {
            @Override
            public void run() {
                if (FishVoiceEngine.this.listener != null) {
                    FishVoiceEngine.this.listener.onStateChanged(
                            FishVoiceEngine.this.isPlaying,
                            FishVoiceEngine.this.isLoading,
                            FishVoiceEngine.this.currentIndex,
                            FishVoiceEngine.this.sentences.length,
                            currentSent,
                            activeVoice.label,
                            FishVoiceEngine.this.speedMultiplier,
                            activePara
                    );
                }
            }
        });
    }

    public void shutdown() {
        stopAndClear();
        mainHandler.removeCallbacksAndMessages(null);
        listener = null;
        sActiveInstances.remove(this);
        if (this.systemTts != null) {
            try {
                this.systemTts.shutdown();
            } catch (Throwable ignored) {
            }
            this.systemTts = null;
        }
    }
}

