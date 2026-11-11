package app.fishreadv2;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import java.util.Locale;

public class MainActivity extends Activity {
    static boolean visible;
    private TextView overlayPermStatusView;
    private TextView accessibilityPermStatusView;
    private TextView launchOverlayBtn;
    private EditText quickTextEdit;
    private final TextView[] voiceCards = new TextView[FishVoiceEngine.VOICES.length];
    private FishVoiceEngine voiceEngine;
    private TextView wpmValueView;
    private int selectedSection;
    private ReaderTheme palette;
    private String draftText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        this.voiceEngine = new FishVoiceEngine(this);
        selectedSection = savedInstanceState == null ? 0 : savedInstanceState.getInt("section", 0);
        draftText = savedInstanceState == null ? null : savedInstanceState.getString("draft");
        buildUi();
        handleIncomingShareOrProcessText(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingShareOrProcessText(intent);
    }

    @Override
    protected void onStart() {
        super.onStart();
        visible = true;
    }

    @Override
    protected void onStop() {
        visible = false;
        super.onStop();
    }

    @Override
    protected void onResume() {
        super.onResume();
        refreshPermissionsUi();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        outState.putInt("section", selectedSection);
        if (quickTextEdit != null) outState.putString("draft", quickTextEdit.getText().toString());
        super.onSaveInstanceState(outState);
    }

    private void buildUi() {
        if (quickTextEdit != null) draftText = quickTextEdit.getText().toString();
        palette = ReaderTheme.forId(getSharedPreferences("fish_reader_prefs", MODE_PRIVATE).getString("theme", "papier"));
        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(Color.parseColor(palette.paper));

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        int pad = dp(18);
        root.setPadding(pad, dp(24), pad, dp(32));
        scroll.addView(root);

        TextView badge = new TextView(this);
        badge.setText("FISH READER ANDROID · " + BuildConfig.VERSION_NAME);
        badge.setTextColor(Color.parseColor(palette.accent));
        badge.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11.0f);
        badge.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        root.addView(badge);

        TextView title = new TextView(this);
        title.setText(new String[]{"FishReader", "Voix et vitesse", "Réglages"}[selectedSection]);
        title.setTextColor(Color.parseColor(palette.ink));
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 24.0f);
        title.setTypeface(Typeface.SERIF, Typeface.BOLD);
        LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        titleLp.topMargin = dp(4);
        root.addView(title, titleLp);
        LinearLayout navigation = new LinearLayout(this);
        String[] destinations = {"Accueil", "Voix", "Réglages"};
        for (int i = 0; i < destinations.length; i++) {
            final int destination = i;
            TextView tab = createActionRowButton(destinations[i], i == selectedSection, view -> {
                selectedSection = destination;
                buildUi();
            });
            tab.setLayoutParams(new LinearLayout.LayoutParams(0, dp(48), 1));
            tab.setGravity(Gravity.CENTER);
            tab.setSelected(i == selectedSection);
            navigation.addView(tab);
        }
        root.addView(navigation);

        TextView subtitle = new TextView(this);
        subtitle.setText(selectedSection == 0
                ? "Votre lecteur personnel hors ligne. Ouvrez un document, scannez-le, puis choisissez un bloc à écouter. La bulle ouvre ensuite les commandes."
                : selectedSection == 1 ? "Choisissez une voix française installée sur Android et réglez le débit. Aucun compte nécessaire."
                : "Personnalisez la lecture, l’apparence et les autorisations. Les captures sont traitées sur le téléphone.");
        subtitle.setTextColor(Color.parseColor(palette.muted));
        subtitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13.0f);
        LinearLayout.LayoutParams subLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        subLp.topMargin = dp(6);
        subLp.bottomMargin = dp(14);
        root.addView(subtitle, subLp);

        LinearLayout permCard = createCard();
        this.overlayPermStatusView = createActionRowButton(
                "1. Autoriser « Afficher par-dessus d’autres applis »",
                false,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        MainActivity.this.requestOverlayPermission();
                    }
                }
        );
        permCard.addView(this.overlayPermStatusView);

        this.accessibilityPermStatusView = createActionRowButton(
                "2. Activer « Fish Reader — Lecture d’écran » (Accessibilité)",
                false,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        MainActivity.this.openAccessibilitySettings();
                    }
                }
        );
        ((LinearLayout.LayoutParams) this.accessibilityPermStatusView.getLayoutParams()).topMargin = dp(8);
        permCard.addView(this.accessibilityPermStatusView);

        this.launchOverlayBtn = createActionRowButton(
                "▶ Activer le petit rond flottant et aller à l’accueil",
                true,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        MainActivity.this.startFloatingBubbleNow(true);
                    }
                }
        );
        ((LinearLayout.LayoutParams) this.launchOverlayBtn.getLayoutParams()).topMargin = dp(10);
        permCard.addView(this.launchOverlayBtn);
        overlayPermStatusView.setVisibility(selectedSection == 2 ? View.VISIBLE : View.GONE);
        accessibilityPermStatusView.setVisibility(selectedSection == 2 ? View.VISIBLE : View.GONE);
        launchOverlayBtn.setVisibility(selectedSection == 0 ? View.VISIBLE : View.GONE);
        permCard.setVisibility(selectedSection == 1 ? View.GONE : View.VISIBLE);
        root.addView(permCard);

        android.widget.Switch rescanSwitch = new android.widget.Switch(this);
        rescanSwitch.setText("Suivre mon défilement pendant une lecture");
        rescanSwitch.setTextColor(Color.parseColor(palette.ink));
        rescanSwitch.setChecked(getSharedPreferences("fish_reader_prefs", MODE_PRIVATE)
                .getBoolean("scan_after_scroll", false));
        rescanSwitch.setOnCheckedChangeListener((button, checked) ->
                getSharedPreferences("fish_reader_prefs", MODE_PRIVATE).edit()
                        .putBoolean("scan_after_scroll", checked).apply());
        rescanSwitch.setVisibility(selectedSection == 2 ? View.VISIBLE : View.GONE);
        root.addView(rescanSwitch);
        TextView rescanHelp = new TextView(this);
        rescanHelp.setText("Le suivi commence seulement après le choix d’un bloc et le lancement de sa lecture. Il reste dans la même fenêtre de document. Pause et Stop suspendent le suivi ; changer d’application ferme la session. Une autre fenêtre nécessite un nouveau scan.");
        rescanHelp.setTextColor(Color.parseColor(palette.muted));
        rescanHelp.setVisibility(selectedSection == 2 ? View.VISIBLE : View.GONE);
        root.addView(rescanHelp);
        if (selectedSection == 2) {
            LinearLayout appearance = createCard();
            TextView heading = new TextView(this);
            heading.setText("Apparence"); heading.setTextColor(Color.parseColor(palette.ink));
            heading.setTextSize(18); appearance.addView(heading);
            String[] ids = {"papier", "sepia", "nuit"};
            String[] labels = {"Papier", "Sépia", "Nuit"};
            String current = getSharedPreferences("fish_reader_prefs", MODE_PRIVATE).getString("theme", "papier");
            for (int i = 0; i < ids.length; i++) {
                final String theme = ids[i];
                appearance.addView(createActionRowButton(labels[i], theme.equals(current), view -> {
                    getSharedPreferences("fish_reader_prefs", MODE_PRIVATE).edit().putString("theme", theme).apply();
                    buildUi();
                }));
            }
            root.addView(appearance);
            TextView privacy = new TextView(this);
            privacy.setText("Sans compte · sans synchronisation · aucun envoi de capture ou de texte. Le raccourci d’accessibilité Android est facultatif ; la bulle FishReader suffit pour lire.");
            privacy.setTextColor(Color.parseColor(palette.muted));
            privacy.setPadding(0, dp(16), 0, dp(16));
            root.addView(privacy);
        }

        LinearLayout voiceCard = createCard();
        ((LinearLayout.LayoutParams) voiceCard.getLayoutParams()).topMargin = dp(14);

        TextView voiceTitle = new TextView(this);
        voiceTitle.setText("Profils vocaux · voix françaises installées sur Android");
        voiceTitle.setTextColor(Color.parseColor(palette.ink));
        voiceTitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15.0f);
        voiceTitle.setTypeface(Typeface.SERIF, Typeface.BOLD);
        voiceCard.addView(voiceTitle);

        for (int i = 0; i < FishVoiceEngine.VOICES.length; i++) {
            final FishVoiceEngine.VoiceSpec spec = FishVoiceEngine.VOICES[i];
            TextView btn = createActionRowButton(
                    spec.label + " — " + spec.subtitle,
                    false,
                    new View.OnClickListener() {
                        @Override
                        public void onClick(View v) {
                            MainActivity.this.voiceEngine.setSelectedVoiceById(spec.id);
                            MainActivity.this.refreshVoiceSelectionUi();
                            MainActivity.this.voiceEngine.speakText(
                                    "Bonjour, je suis " + spec.label + ". Touchez un paragraphe sur votre écran pour démarrer la lecture."
                            );
                        }
                    }
            );
            ((LinearLayout.LayoutParams) btn.getLayoutParams()).topMargin = dp(7);
            this.voiceCards[i] = btn;
            voiceCard.addView(btn);
        }

        this.wpmValueView = new TextView(this);
        this.wpmValueView.setTextColor(Color.parseColor(palette.accent));
        this.wpmValueView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12.0f);
        this.wpmValueView.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        LinearLayout.LayoutParams wpmLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        wpmLp.topMargin = dp(12);
        voiceCard.addView(this.wpmValueView, wpmLp);

        LinearLayout speedRow = new LinearLayout(this);
        speedRow.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams speedRowLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        speedRowLp.topMargin = dp(6);
        speedRow.setLayoutParams(speedRowLp);

        float[] speeds = new float[]{0.85f, 1.0f, 1.25f, 1.5f, 1.75f, 2.0f};
        for (int i = 0; i < speeds.length; i++) {
            final float mult = speeds[i];
            TextView chip = new TextView(this);
            chip.setText(String.format(Locale.US, "%.2f×", mult).replace(".00", "").replace("0×", "×"));
            chip.setGravity(Gravity.CENTER);
            chip.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12.0f);
            chip.setTypeface(Typeface.DEFAULT_BOLD);
            chip.setPadding(dp(4), dp(8), dp(4), dp(8));
            chip.setTextColor(Color.parseColor(palette.ink));
            GradientDrawable bg = new GradientDrawable();
            bg.setColor(Color.parseColor(palette.rule));
            bg.setCornerRadius(dp(8));
            chip.setBackground(bg);
            LinearLayout.LayoutParams chipLp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
            if (i > 0) {
                chipLp.leftMargin = dp(4);
            }
            chip.setLayoutParams(chipLp);
            chip.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    MainActivity.this.voiceEngine.setSpeedMultiplier(mult);
                    MainActivity.this.refreshVoiceSelectionUi();
                }
            });
            speedRow.addView(chip);
        }
        voiceCard.addView(speedRow);
        voiceCard.setVisibility(selectedSection == 1 ? View.VISIBLE : View.GONE);
        root.addView(voiceCard);

        LinearLayout testCard = createCard();
        ((LinearLayout.LayoutParams) testCard.getLayoutParams()).topMargin = dp(14);

        TextView testTitle = new TextView(this);
        testTitle.setText("Tester une lecture rapide");
        testTitle.setTextColor(Color.parseColor(palette.ink));
        testTitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15.0f);
        testTitle.setTypeface(Typeface.SERIF, Typeface.BOLD);
        testCard.addView(testTitle);

        this.quickTextEdit = new EditText(this);
        this.quickTextEdit.setText(
                "Bienvenue dans FishReader. Choisissez un texte, prenez une pause et écoutez à votre rythme."
        );
        if (draftText != null) this.quickTextEdit.setText(draftText);
        this.quickTextEdit.setTextColor(Color.parseColor(palette.ink));
        this.quickTextEdit.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13.0f);
        this.quickTextEdit.setMinLines(3);
        testCard.addView(this.quickTextEdit);

        TextView playSampleBtn = createActionRowButton(
                "🔊 Écouter ce texte maintenant",
                true,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        String text = MainActivity.this.quickTextEdit.getText().toString().trim();
                        if (!TextUtils.isEmpty(text)) {
                            MainActivity.this.voiceEngine.speakText(text);
                        }
                    }
                }
        );
        ((LinearLayout.LayoutParams) playSampleBtn.getLayoutParams()).topMargin = dp(8);
        testCard.addView(playSampleBtn);
        testCard.setVisibility(selectedSection == 0 ? View.VISIBLE : View.GONE);
        root.addView(testCard);

        setContentView(scroll);
        refreshVoiceSelectionUi();
        refreshPermissionsUi();
        refreshVoiceSelectionUi();
    }

    private void refreshVoiceSelectionUi() {
        String selectedId = this.voiceEngine.getSelectedVoice().id;
        for (int i = 0; i < FishVoiceEngine.VOICES.length; i++) {
            FishVoiceEngine.VoiceSpec spec = FishVoiceEngine.VOICES[i];
            boolean active = spec.id.equals(selectedId);
            styleRowButton(
                    this.voiceCards[i],
                    (active ? "✓ " : "○ ") + spec.label + " — " + spec.subtitle,
                    active
            );
        }
        float mult = this.voiceEngine.getSpeedMultiplier();
        int wpm = this.voiceEngine.getCurrentWpm();
        if (this.wpmValueView != null) {
            this.wpmValueView.setText(
                    "Débit actif : " + wpm + " mots/min (" + mult + "×) · Hauteur tonale naturelle verrouillée"
            );
        }
    }

    private LinearLayout createCard() {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        int pad = dp(14);
        card.setPadding(pad, pad, pad, pad);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor(palette.surface));
        bg.setCornerRadius(dp(14));
        bg.setStroke(dp(1), Color.parseColor(palette.rule));
        card.setBackground(bg);
        card.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));
        return card;
    }

    private TextView createActionRowButton(String label, boolean primary, View.OnClickListener listener) {
        TextView btn = new TextView(this);
        btn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13.0f);
        btn.setTypeface(Typeface.DEFAULT_BOLD);
        btn.setPadding(dp(14), dp(12), dp(14), dp(12));
        btn.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));
        styleRowButton(btn, label, primary);
        btn.setOnClickListener(listener);
        return btn;
    }

    private void styleRowButton(TextView btn, String label, boolean primary) {
        if (btn == null) {
            return;
        }
        btn.setText(label);
        GradientDrawable bg = new GradientDrawable();
        bg.setCornerRadius(dp(10));
        if (primary) {
            bg.setColor(Color.parseColor(palette.accent));
            btn.setTextColor(Color.parseColor(palette.onAccent));
        } else {
            bg.setColor(Color.parseColor(palette.paper));
            bg.setStroke(dp(1), Color.parseColor(palette.rule));
            btn.setTextColor(Color.parseColor(palette.ink));
        }
        btn.setBackground(bg);
    }

    private void refreshPermissionsUi() {
        boolean overlayOk = Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(this);
        boolean accessOk = isAccessibilityServiceEnabled();

        styleRowButton(
                this.overlayPermStatusView,
                overlayOk
                        ? "✓ Étape 1 activée : Superposition par-dessus les autres applis"
                        : "1. Autoriser « Afficher par-dessus d’autres applis » (Requis)",
                overlayOk
        );
        styleRowButton(
                this.accessibilityPermStatusView,
                accessOk
                        ? "✓ Étape 2 activée : Service de lecture d’écran Accessibilité"
                        : "2. Activer « Fish Reader — Lecture d’écran » (Accessibilité)",
                accessOk
        );
        styleRowButton(
                this.launchOverlayBtn,
                overlayOk
                        ? "✓ Activer le petit rond flottant — Aller à l’écran d’accueil"
                        : "▶ Activer le petit rond flottant par-dessus mes applis",
                true
        );

        if (overlayOk) {
            Intent svc = new Intent(this, FishOverlayService.class);
            svc.setAction(FishOverlayService.ACTION_START_OVERLAY);
            startOverlayServiceCompat(svc);
        }
    }

    private void requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= 23 && !Settings.canDrawOverlays(this)) {
            Intent intent = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName())
            );
            startActivity(intent);
        } else {
            Toast.makeText(this, "La superposition est déjà autorisée !", Toast.LENGTH_SHORT).show();
        }
    }

    private void openAccessibilitySettings() {
        try {
            startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS));
            Toast.makeText(
                    this,
                    "Activez « Fish Reader — Lecture d’écran » dans la liste",
                    Toast.LENGTH_LONG
            ).show();
        } catch (Throwable ignored) {
        }
    }

    private boolean isAccessibilityServiceEnabled() {
        try {
            String enabled = Settings.Secure.getString(
                    getContentResolver(),
                    Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            );
            if (enabled == null) {
                return false;
            }
            String pkg = getPackageName();
            return enabled.contains(pkg + "/" + FishAccessibilityService.class.getName())
                    || enabled.contains(pkg + "/.FishAccessibilityService");
        } catch (Throwable ignored) {
            return false;
        }
    }

    private void startFloatingBubbleNow(boolean goHome) {
        if (Build.VERSION.SDK_INT >= 23 && !Settings.canDrawOverlays(this)) {
            Toast.makeText(
                    this,
                    "Veuillez d’abord autoriser l’Étape 1 (Afficher par-dessus d’autres applis)",
                    Toast.LENGTH_LONG
            ).show();
            requestOverlayPermission();
            return;
        }
        Intent svc = new Intent(this, FishOverlayService.class);
        svc.setAction(FishOverlayService.ACTION_START_OVERLAY);
        startOverlayServiceCompat(svc);
        Toast.makeText(this, "Petit rond flottant Fish Reader activé !", Toast.LENGTH_SHORT).show();
        if (goHome) {
            Intent home = new Intent(Intent.ACTION_MAIN);
            home.addCategory(Intent.CATEGORY_HOME);
            home.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(home);
        }
    }

    private void handleIncomingShareOrProcessText(Intent intent) {
        if (intent == null) {
            return;
        }
        String action = intent.getAction();
        String incomingText = null;
        if (Intent.ACTION_SEND.equals(action)) {
            incomingText = intent.getStringExtra(Intent.EXTRA_TEXT);
        } else if (Intent.ACTION_PROCESS_TEXT.equals(action)) {
            CharSequence cs = intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT);
            if (cs != null) {
                incomingText = cs.toString();
            }
        }
        if (!TextUtils.isEmpty(incomingText)) {
            FishAccessibilityService.setLastCopiedOrSelectedText(incomingText);
            if (Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(this)) {
                Intent svc = new Intent(this, FishOverlayService.class);
                svc.setAction(FishOverlayService.ACTION_SPEAK_TEXT);
                svc.putExtra(FishOverlayService.EXTRA_TEXT, incomingText);
                startOverlayServiceCompat(svc);
                finish();
                return;
            }
            if (this.quickTextEdit != null) {
                this.quickTextEdit.setText(incomingText);
                this.voiceEngine.speakText(incomingText);
            }
        }
    }

    private void startOverlayServiceCompat(Intent intent) {
        try {
            if (Build.VERSION.SDK_INT >= 26) {
                Context.class.getMethod("startForegroundService", Intent.class).invoke(this, intent);
            } else {
                startService(intent);
            }
        } catch (Throwable ignored) {
            try {
                startService(intent);
            } catch (Throwable ignored2) {
            }
        }
    }

    private int dp(int value) {
        return Math.round(TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                value,
                getResources().getDisplayMetrics()
        ));
    }

    @Override
    protected void onDestroy() {
        if (this.voiceEngine != null) {
            this.voiceEngine.shutdown();
        }
        super.onDestroy();
    }
}


