package app.fishreadv2;

import android.animation.ValueAnimator;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.DisplayMetrics;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class FishOverlayService extends Service {
    public static final String ACTION_START_OVERLAY = "ACTION_START_OVERLAY";
    public static final String ACTION_STOP_OVERLAY = "ACTION_STOP_OVERLAY";
    public static final String ACTION_SPEAK_TEXT = "ACTION_SPEAK_TEXT";
    public static final String EXTRA_TEXT = "extra_text";

    private static final String CHANNEL_ID = "fish_reader_overlay_channel";
    private static final int NOTIFICATION_ID = 4102;

    private static final int UI_STATE_IDLE_CIRCLE = 0;
    private static final int UI_STATE_SCAN_SELECT = 1;
    private static final int UI_STATE_VERTICAL_PILL = 2;
    private static final int UI_STATE_CONFIG_PANEL = 3;

    private WindowManager windowManager;
    private FishVoiceEngine voiceEngine;
    private FrameLayout rootContainer;
    private WindowManager.LayoutParams floatingParams;

    private View idleCircleView;
    private View verticalPillView;
    private View configPanelView;

    private GradientDrawable verticalCircleHaloDrawable;
    private TextView verticalCircleSymbolView;
    private TextView statusHeaderTextView;
    private TextView playPauseConfigBtn;
    private TextView wpmLabelView;

    private final List<TextView> voiceButtons = new ArrayList<>();
    private final List<TextView> speedButtons = new ArrayList<>();

    private ScreenCanvasOverlayView screenCanvasView;
    private WindowManager.LayoutParams screenCanvasParams;
    private boolean screenCanvasAttached = false;

    private int currentUiState = UI_STATE_IDLE_CIRCLE;
    private List<FishAccessibilityService.ScreenBlock> currentBlocks = new ArrayList<>();
    private int activeParagraphIndex = -1;
    private float scanBeamProgress = -1.0f;

    private ValueAnimator scanAnimator;
    private ValueAnimator pulseAnimator;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    public void onCreate() {
        super.onCreate();
        this.windowManager = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
        this.voiceEngine = new FishVoiceEngine(this);
        this.voiceEngine.setListener(new FishVoiceEngine.PlaybackListener() {
            @Override
            public void onStateChanged(boolean isPlaying, boolean isLoading, int currentSentenceIndex, int totalSentences, String currentSentence, String activeVoiceLabel, float speedMultiplier, int activeParagraphIndex) {
                FishOverlayService.this.updateUiFromEngine(
                        isPlaying,
                        isLoading,
                        currentSentenceIndex,
                        totalSentences,
                        currentSentence,
                        activeVoiceLabel,
                        speedMultiplier,
                        activeParagraphIndex
                );
            }
        });
        startForegroundSafe();
        ensureOverlayAttached();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if (ACTION_STOP_OVERLAY.equals(action)) {
                stopSelf();
                return START_NOT_STICKY;
            }
            ensureOverlayAttached();
            if (ACTION_SPEAK_TEXT.equals(action)) {
                String text = intent.getStringExtra(EXTRA_TEXT);
                if (!TextUtils.isEmpty(text)) {
                    this.currentBlocks.clear();
                    this.activeParagraphIndex = -1;
                    detachScreenCanvasOverlay();
                    switchUiState(UI_STATE_VERTICAL_PILL);
                    this.voiceEngine.speakText(text);
                }
            }
        } else {
            ensureOverlayAttached();
        }
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void startForegroundSafe() {
        try {
            Notification.Builder builder;
            if (Build.VERSION.SDK_INT >= 26) {
                NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) {
                    Class<?> channelClass = Class.forName("android.app.NotificationChannel");
                    Object channel = channelClass.getConstructor(String.class, CharSequence.class, int.class)
                            .newInstance(CHANNEL_ID, "Fish Reader — Bulle & Lecture d’écran", 2);
                    channelClass.getMethod("setDescription", String.class)
                            .invoke(channel, "Maintient la bulle discrète et la surbrillance directe actives");
                    nm.getClass().getMethod("createNotificationChannel", channelClass).invoke(nm, channel);
                }
                builder = Notification.Builder.class.getConstructor(Context.class, String.class)
                        .newInstance(this, CHANNEL_ID);
            } else {
                builder = new Notification.Builder(this);
            }
            Intent openApp = new Intent(this, MainActivity.class);
            openApp.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            int piFlags = Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0;
            PendingIntent pi = PendingIntent.getActivity(this, 0, openApp, piFlags);
            builder.setContentTitle("Fish Reader actif")
                    .setContentText("Touchez le petit rond pour scanner l’écran et choisir un paragraphe")
                    .setSmallIcon(R.drawable.ic_launcher)
                    .setContentIntent(pi)
                    .setOngoing(true);
            startForeground(NOTIFICATION_ID, builder.build());
        } catch (Throwable ignored) {
        }
    }

    private boolean canDrawOverlays() {
        if (Build.VERSION.SDK_INT < 23) {
            return true;
        }
        return Settings.canDrawOverlays(this);
    }

    private void ensureOverlayAttached() {
        if (!canDrawOverlays() || this.rootContainer != null) {
            return;
        }
        int windowType = Build.VERSION.SDK_INT >= 26
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;

        this.floatingParams = new WindowManager.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                windowType,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT
        );
        this.floatingParams.gravity = Gravity.TOP | Gravity.START;
        DisplayMetrics dm = getResources().getDisplayMetrics();
        this.floatingParams.x = Math.max(0, dm.widthPixels - dp(56));
        this.floatingParams.y = dp(240);

        this.rootContainer = new FrameLayout(this);
        this.idleCircleView = buildIdleCircleView();
        this.verticalPillView = buildVerticalPillView();
        this.configPanelView = buildConfigPanelView();

        this.rootContainer.addView(this.idleCircleView);
        this.rootContainer.addView(this.verticalPillView);
        this.rootContainer.addView(this.configPanelView);

        switchUiState(UI_STATE_IDLE_CIRCLE);
        try {
            this.windowManager.addView(this.rootContainer, this.floatingParams);
            startHaloPulseAnimation();
        } catch (Throwable ignored) {
        }
    }

    private View buildIdleCircleView() {
        FrameLayout circle = new FrameLayout(this);
        int size = dp(46);
        circle.setLayoutParams(new FrameLayout.LayoutParams(size, size));

        GradientDrawable bg = new GradientDrawable();
        bg.setShape(GradientDrawable.OVAL);
        bg.setColor(Color.parseColor("#A8141311"));
        bg.setStroke(dp(2), Color.parseColor("#884BA37E"));
        circle.setBackground(bg);
        if (Build.VERSION.SDK_INT >= 21) {
            circle.setElevation(dp(6));
        }

        TextView icon = new TextView(this);
        icon.setText("◉");
        icon.setTextColor(Color.parseColor("#6EE7B7"));
        icon.setTextSize(TypedValue.COMPLEX_UNIT_SP, 20.0f);
        icon.setTypeface(Typeface.DEFAULT_BOLD);
        icon.setGravity(Gravity.CENTER);
        circle.addView(icon, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        attachDragAndClickListener(circle, new Runnable() {
            @Override
            public void run() {
                FishOverlayService.this.onIdleCircleTapped();
            }
        });
        return circle;
    }

    private View buildVerticalPillView() {
        LinearLayout pill = new LinearLayout(this);
        pill.setOrientation(LinearLayout.VERTICAL);
        pill.setGravity(Gravity.CENTER_HORIZONTAL);
        pill.setPadding(dp(5), dp(6), dp(5), dp(6));

        GradientDrawable pillBg = new GradientDrawable();
        pillBg.setShape(GradientDrawable.RECTANGLE);
        pillBg.setCornerRadius(dp(24));
        pillBg.setColor(Color.parseColor("#DF141311"));
        pillBg.setStroke(dp(1), Color.parseColor("#804BA37E"));
        pill.setBackground(pillBg);
        if (Build.VERSION.SDK_INT >= 21) {
            pill.setElevation(dp(8));
        }

        FrameLayout topCircle = new FrameLayout(this);
        int circleSize = dp(36);
        topCircle.setLayoutParams(new LinearLayout.LayoutParams(circleSize, circleSize));
        this.verticalCircleHaloDrawable = new GradientDrawable();
        this.verticalCircleHaloDrawable.setShape(GradientDrawable.OVAL);
        this.verticalCircleHaloDrawable.setColor(Color.parseColor("#2E4BA37E"));
        this.verticalCircleHaloDrawable.setStroke(dp(2), Color.parseColor("#6EE7B7"));
        topCircle.setBackground(this.verticalCircleHaloDrawable);

        this.verticalCircleSymbolView = new TextView(this);
        this.verticalCircleSymbolView.setText("◉");
        this.verticalCircleSymbolView.setTextColor(Color.parseColor("#6EE7B7"));
        this.verticalCircleSymbolView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16.0f);
        this.verticalCircleSymbolView.setTypeface(Typeface.DEFAULT_BOLD);
        this.verticalCircleSymbolView.setGravity(Gravity.CENTER);
        topCircle.addView(this.verticalCircleSymbolView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        attachDragAndClickListener(topCircle, new Runnable() {
            @Override
            public void run() {
                if (FishOverlayService.this.voiceEngine.getTotalSentences() > 0) {
                    FishOverlayService.this.voiceEngine.togglePlayPause();
                } else {
                    FishOverlayService.this.onIdleCircleTapped();
                }
            }
        });

        View divider = new View(this);
        LinearLayout.LayoutParams divLp = new LinearLayout.LayoutParams(dp(22), dp(1));
        divLp.topMargin = dp(5);
        divLp.bottomMargin = dp(3);
        divider.setLayoutParams(divLp);
        divider.setBackgroundColor(Color.parseColor("#38FFFFFF"));

        TextView dotsBtn = new TextView(this);
        dotsBtn.setText("⋯");
        dotsBtn.setTextColor(Color.parseColor("#F5F2EB"));
        dotsBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 19.0f);
        dotsBtn.setTypeface(Typeface.DEFAULT_BOLD);
        dotsBtn.setGravity(Gravity.CENTER);
        dotsBtn.setLayoutParams(new LinearLayout.LayoutParams(dp(36), dp(30)));
        attachDragAndClickListener(dotsBtn, new Runnable() {
            @Override
            public void run() {
                FishOverlayService.this.switchUiState(UI_STATE_CONFIG_PANEL);
            }
        });

        pill.addView(topCircle);
        pill.addView(divider);
        pill.addView(dotsBtn);
        return pill;
    }

    private View buildConfigPanelView() {
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        int pad = dp(12);
        panel.setPadding(pad, dp(10), pad, pad);
        panel.setLayoutParams(new FrameLayout.LayoutParams(dp(278), ViewGroup.LayoutParams.WRAP_CONTENT));

        GradientDrawable panelBg = new GradientDrawable();
        panelBg.setColor(Color.parseColor("#F4161513"));
        panelBg.setCornerRadius(dp(18));
        panelBg.setStroke(dp(1), Color.parseColor("#554BA37E"));
        panel.setBackground(panelBg);
        if (Build.VERSION.SDK_INT >= 21) {
            panel.setElevation(dp(12));
        }

        LinearLayout headerRow = new LinearLayout(this);
        headerRow.setOrientation(LinearLayout.HORIZONTAL);
        headerRow.setGravity(Gravity.CENTER_VERTICAL);

        this.statusHeaderTextView = new TextView(this);
        this.statusHeaderTextView.setText("Lecture en cours");
        this.statusHeaderTextView.setTextColor(Color.parseColor("#6EE7B7"));
        this.statusHeaderTextView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12.0f);
        this.statusHeaderTextView.setTypeface(Typeface.DEFAULT_BOLD);
        this.statusHeaderTextView.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        TextView collapseBtn = createMiniChipButton("⎯ Pilule", "#29FFFFFF", "#F5F2EB");
        collapseBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (FishOverlayService.this.voiceEngine.getTotalSentences() > 0) {
                    FishOverlayService.this.switchUiState(UI_STATE_VERTICAL_PILL);
                } else {
                    FishOverlayService.this.switchUiState(UI_STATE_IDLE_CIRCLE);
                }
            }
        });

        TextView stopBtn = createMiniChipButton("⏹ Stop", "#3DDF4B4B", "#FCA5A5");
        LinearLayout.LayoutParams stopLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        stopLp.leftMargin = dp(6);
        stopBtn.setLayoutParams(stopLp);
        stopBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                FishOverlayService.this.stopReadingAndResetToCircle();
            }
        });

        headerRow.addView(this.statusHeaderTextView);
        headerRow.addView(collapseBtn);
        headerRow.addView(stopBtn);
        panel.addView(headerRow);
        attachDragAndClickListener(this.statusHeaderTextView, null);

        LinearLayout transportRow = new LinearLayout(this);
        transportRow.setOrientation(LinearLayout.HORIZONTAL);
        transportRow.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams transLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        transLp.topMargin = dp(9);
        transportRow.setLayoutParams(transLp);

        TextView prevBtn = createFlexButton("⏮ -1 phr.", "#24FFFFFF", "#E7E2D8");
        prevBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                FishOverlayService.this.voiceEngine.previousSentence();
            }
        });

        this.playPauseConfigBtn = createFlexButton("⏸ Pause", "#1E4D3B", "#FFFFFF");
        LinearLayout.LayoutParams ppLp = (LinearLayout.LayoutParams) this.playPauseConfigBtn.getLayoutParams();
        ppLp.leftMargin = dp(5);
        ppLp.rightMargin = dp(5);
        this.playPauseConfigBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (FishOverlayService.this.voiceEngine.getTotalSentences() > 0) {
                    FishOverlayService.this.voiceEngine.togglePlayPause();
                } else {
                    FishOverlayService.this.switchUiState(UI_STATE_IDLE_CIRCLE);
                    FishOverlayService.this.onIdleCircleTapped();
                }
            }
        });

        TextView nextBtn = createFlexButton("⏭ +1 phr.", "#24FFFFFF", "#E7E2D8");
        nextBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                FishOverlayService.this.voiceEngine.nextSentence();
            }
        });

        transportRow.addView(prevBtn);
        transportRow.addView(this.playPauseConfigBtn);
        transportRow.addView(nextBtn);
        panel.addView(transportRow);

        TextView voiceHeader = new TextView(this);
        voiceHeader.setText("VOIX NATURELLE");
        voiceHeader.setTextColor(Color.parseColor("#9CA3AF"));
        voiceHeader.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10.0f);
        voiceHeader.setTypeface(Typeface.DEFAULT_BOLD);
        LinearLayout.LayoutParams vhLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        vhLp.topMargin = dp(9);
        voiceHeader.setLayoutParams(vhLp);
        panel.addView(voiceHeader);

        LinearLayout voiceRow = new LinearLayout(this);
        voiceRow.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams vrLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        vrLp.topMargin = dp(4);
        voiceRow.setLayoutParams(vrLp);

        this.voiceButtons.clear();
        String[] shortNames = new String[]{"1/4 Clara", "2/4 Thomas", "3/4 Nicolas", "4/4 Emma"};
        for (int i = 0; i < FishVoiceEngine.VOICES.length; i++) {
            final FishVoiceEngine.VoiceSpec spec = FishVoiceEngine.VOICES[i];
            TextView vBtn = createFlexButton(shortNames[i], "#22FFFFFF", "#D1D5DB");
            vBtn.setTag(spec.id);
            LinearLayout.LayoutParams vLp = (LinearLayout.LayoutParams) vBtn.getLayoutParams();
            if (i > 0) {
                vLp.leftMargin = dp(4);
            }
            vBtn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    FishOverlayService.this.voiceEngine.setSelectedVoiceById(spec.id);
                }
            });
            this.voiceButtons.add(vBtn);
            voiceRow.addView(vBtn);
        }
        panel.addView(voiceRow);

        this.wpmLabelView = new TextView(this);
        this.wpmLabelView.setText("DÉBIT WPM : 175 mots/min (1×)");
        this.wpmLabelView.setTextColor(Color.parseColor("#9CA3AF"));
        this.wpmLabelView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10.0f);
        this.wpmLabelView.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        LinearLayout.LayoutParams wpmLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        wpmLp.topMargin = dp(8);
        this.wpmLabelView.setLayoutParams(wpmLp);
        panel.addView(this.wpmLabelView);

        LinearLayout speedRow = new LinearLayout(this);
        speedRow.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams srLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        srLp.topMargin = dp(4);
        speedRow.setLayoutParams(srLp);

        this.speedButtons.clear();
        float[] speeds = new float[]{0.85f, 1.0f, 1.25f, 1.5f, 1.75f, 2.0f};
        String[] speedLabels = new String[]{"0.85×", "1×", "1.25×", "1.5×", "1.75×", "2×"};
        for (int i = 0; i < speeds.length; i++) {
            final float mult = speeds[i];
            TextView sBtn = createFlexButton(speedLabels[i], "#22FFFFFF", "#D1D5DB");
            sBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10.0f);
            sBtn.setPadding(dp(2), dp(6), dp(2), dp(6));
            sBtn.setTag(mult);
            LinearLayout.LayoutParams sLp = (LinearLayout.LayoutParams) sBtn.getLayoutParams();
            if (i > 0) {
                sLp.leftMargin = dp(3);
            }
            sBtn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    FishOverlayService.this.voiceEngine.setSpeedMultiplier(mult);
                }
            });
            this.speedButtons.add(sBtn);
            speedRow.addView(sBtn);
        }
        panel.addView(speedRow);

        LinearLayout actionRow = new LinearLayout(this);
        actionRow.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams arLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        arLp.topMargin = dp(10);
        actionRow.setLayoutParams(arLp);

        TextView rescanBtn = createFlexButton("🔍 Scanner l’écran", "#264BA37E", "#6EE7B7");
        rescanBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                FishOverlayService.this.voiceEngine.pause();
                FishOverlayService.this.onIdleCircleTapped();
            }
        });

        TextView clipBtn = createFlexButton("📋 Texte copié", "#24FFFFFF", "#F5F2EB");
        ((LinearLayout.LayoutParams) clipBtn.getLayoutParams()).leftMargin = dp(6);
        clipBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                FishOverlayService.this.readCopiedOrSelectedTextWithFocus();
            }
        });

        actionRow.addView(rescanBtn);
        actionRow.addView(clipBtn);
        panel.addView(actionRow);

        refreshVoiceAndSpeedButtons(this.voiceEngine.getSelectedVoice().id, this.voiceEngine.getSpeedMultiplier());
        return panel;
    }

    private TextView createMiniChipButton(String text, String bgHex, String fgHex) {
        TextView tv = new TextView(this);
        tv.setText(text);
        tv.setTextColor(Color.parseColor(fgHex));
        tv.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11.0f);
        tv.setTypeface(Typeface.DEFAULT_BOLD);
        tv.setPadding(dp(9), dp(5), dp(9), dp(5));
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor(bgHex));
        bg.setCornerRadius(dp(12));
        tv.setBackground(bg);
        return tv;
    }

    private TextView createFlexButton(String text, String bgHex, String fgHex) {
        TextView tv = new TextView(this);
        tv.setText(text);
        tv.setTextColor(Color.parseColor(fgHex));
        tv.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11.0f);
        tv.setTypeface(Typeface.DEFAULT_BOLD);
        tv.setGravity(Gravity.CENTER);
        tv.setPadding(dp(6), dp(7), dp(6), dp(7));
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor(bgHex));
        bg.setCornerRadius(dp(10));
        tv.setBackground(bg);
        tv.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));
        return tv;
    }

    private void switchUiState(int state) {
        this.currentUiState = state;
        if (this.idleCircleView == null || this.verticalPillView == null || this.configPanelView == null) {
            return;
        }
        this.idleCircleView.setVisibility(state == UI_STATE_IDLE_CIRCLE ? View.VISIBLE : View.GONE);
        this.verticalPillView.setVisibility(state == UI_STATE_VERTICAL_PILL ? View.VISIBLE : View.GONE);
        this.configPanelView.setVisibility(state == UI_STATE_CONFIG_PANEL ? View.VISIBLE : View.GONE);

        if (this.rootContainer != null && this.floatingParams != null) {
            DisplayMetrics dm = getResources().getDisplayMetrics();
            if (state == UI_STATE_IDLE_CIRCLE || state == UI_STATE_VERTICAL_PILL) {
                int rightEdge = Math.max(0, dm.widthPixels - dp(54));
                if (this.floatingParams.x > dm.widthPixels / 3) {
                    this.floatingParams.x = rightEdge;
                } else {
                    this.floatingParams.x = dp(6);
                }
            } else if (state == UI_STATE_CONFIG_PANEL) {
                this.floatingParams.x = Math.max(dp(8), Math.min(this.floatingParams.x, dm.widthPixels - dp(286)));
            }
            try {
                this.windowManager.updateViewLayout(this.rootContainer, this.floatingParams);
            } catch (Throwable ignored) {
            }
        }
    }

    private void onIdleCircleTapped() {
        if (FishAccessibilityService.getInstance() == null) {
            Toast.makeText(
                    this,
                    "Activez « Fish Reader » dans Accessibilité pour scanner l’écran.",
                    Toast.LENGTH_LONG
            ).show();
            Intent openApp = new Intent(this, MainActivity.class);
            openApp.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(openApp);
            return;
        }
        switchUiState(UI_STATE_SCAN_SELECT);
        attachInteractiveScanCanvas();
        this.mainHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                FishAccessibilityService svc = FishAccessibilityService.getInstance();
                List<FishAccessibilityService.ScreenBlock> blocks = svc != null
                        ? svc.captureStructuredScreenBlocks()
                        : new ArrayList<FishAccessibilityService.ScreenBlock>();
                if (blocks.isEmpty()) {
                    blocks = FishAccessibilityService.getLastCapturedBlocks();
                }
                if (blocks.isEmpty()) {
                    FishOverlayService.this.detachScreenCanvasOverlay();
                    FishOverlayService.this.switchUiState(UI_STATE_IDLE_CIRCLE);
                    Toast.makeText(
                            FishOverlayService.this,
                            "Aucun paragraphe détecté sur cet écran. Faites défiler le post puis réessayez.",
                            Toast.LENGTH_SHORT
                    ).show();
                } else {
                    FishOverlayService.this.currentBlocks = blocks;
                    if (FishOverlayService.this.screenCanvasView != null) {
                        FishOverlayService.this.screenCanvasView.invalidate();
                    }
                }
            }
        }, 120L);
    }

    private void attachInteractiveScanCanvas() {
        if (!canDrawOverlays()) {
            return;
        }
        detachScreenCanvasOverlay();
        int windowType = Build.VERSION.SDK_INT >= 26
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;

        this.screenCanvasParams = new WindowManager.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
                windowType,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT
        );
        this.screenCanvasParams.gravity = Gravity.TOP | Gravity.START;
        this.screenCanvasView = new ScreenCanvasOverlayView(this);
        try {
            this.windowManager.addView(this.screenCanvasView, this.screenCanvasParams);
            this.screenCanvasAttached = true;
            startScanWaveAnimation();
        } catch (Throwable ignored) {
            this.screenCanvasAttached = false;
        }
    }

    private void convertCanvasToPassThroughHighlight() {
        if (this.screenCanvasAttached && this.screenCanvasView != null && this.screenCanvasParams != null) {
            this.screenCanvasParams.flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                    | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                    | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN;
            try {
                this.windowManager.updateViewLayout(this.screenCanvasView, this.screenCanvasParams);
                this.screenCanvasView.invalidate();
            } catch (Throwable ignored) {
            }
        }
    }

    private void detachScreenCanvasOverlay() {
        if (this.scanAnimator != null) {
            try {
                this.scanAnimator.cancel();
            } catch (Throwable ignored) {
            }
            this.scanAnimator = null;
        }
        this.scanBeamProgress = -1.0f;
        if (this.screenCanvasAttached && this.screenCanvasView != null) {
            try {
                this.windowManager.removeView(this.screenCanvasView);
            } catch (Throwable ignored) {
            }
        }
        this.screenCanvasAttached = false;
        this.screenCanvasView = null;
    }

    private void startScanWaveAnimation() {
        if (this.scanAnimator != null) {
            this.scanAnimator.cancel();
        }
        this.scanBeamProgress = 0.0f;
        this.scanAnimator = ValueAnimator.ofFloat(0.0f, 1.0f);
        this.scanAnimator.setDuration(450L);
        this.scanAnimator.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
            @Override
            public void onAnimationUpdate(ValueAnimator animation) {
                FishOverlayService.this.scanBeamProgress = (Float) animation.getAnimatedValue();
                if (FishOverlayService.this.screenCanvasView != null) {
                    FishOverlayService.this.screenCanvasView.invalidate();
                }
            }
        });
        this.scanAnimator.start();
        this.mainHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                FishOverlayService.this.scanBeamProgress = -1.0f;
                if (FishOverlayService.this.screenCanvasView != null) {
                    FishOverlayService.this.screenCanvasView.invalidate();
                }
            }
        }, 470L);
    }

    private void startReadingFromParagraph(int index) {
        if (this.currentBlocks == null || this.currentBlocks.isEmpty()) {
            return;
        }
        int safeIdx = Math.max(0, Math.min(index, this.currentBlocks.size() - 1));
        this.activeParagraphIndex = safeIdx;
        convertCanvasToPassThroughHighlight();
        switchUiState(UI_STATE_VERTICAL_PILL);
        this.voiceEngine.speakBlocksFromParagraph(this.currentBlocks, safeIdx);
    }

    private void stopReadingAndResetToCircle() {
        this.voiceEngine.stopAndClear();
        this.activeParagraphIndex = -1;
        this.currentBlocks.clear();
        detachScreenCanvasOverlay();
        switchUiState(UI_STATE_IDLE_CIRCLE);
    }

    private void readCopiedOrSelectedTextWithFocus() {
        if (this.rootContainer != null && this.floatingParams != null) {
            try {
                this.floatingParams.flags &= ~WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
                this.windowManager.updateViewLayout(this.rootContainer, this.floatingParams);
            } catch (Throwable ignored) {
            }
        }
        this.mainHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                String text = FishOverlayService.this.extractClipboardTextNow();
                if (FishOverlayService.this.rootContainer != null && FishOverlayService.this.floatingParams != null) {
                    try {
                        FishOverlayService.this.floatingParams.flags |= WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
                        FishOverlayService.this.windowManager.updateViewLayout(
                                FishOverlayService.this.rootContainer,
                                FishOverlayService.this.floatingParams
                        );
                    } catch (Throwable ignored) {
                    }
                }
                if (TextUtils.isEmpty(text)) {
                    text = FishAccessibilityService.getLastCopiedOrSelectedText();
                }
                if (!TextUtils.isEmpty(text)) {
                    FishAccessibilityService.setLastCopiedOrSelectedText(text);
                    FishOverlayService.this.currentBlocks.clear();
                    FishOverlayService.this.activeParagraphIndex = -1;
                    FishOverlayService.this.detachScreenCanvasOverlay();
                    FishOverlayService.this.switchUiState(UI_STATE_VERTICAL_PILL);
                    FishOverlayService.this.voiceEngine.speakText(text);
                    return;
                }
                Toast.makeText(
                        FishOverlayService.this,
                        "Aucun texte copié détecté. Copiez un texte puis touchez « Texte copié ».",
                        Toast.LENGTH_SHORT
                ).show();
            }
        }, 85L);
    }

    private String extractClipboardTextNow() {
        try {
            ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm != null && cm.hasPrimaryClip()) {
                ClipData clip = cm.getPrimaryClip();
                if (clip != null && clip.getItemCount() > 0) {
                    CharSequence cs = clip.getItemAt(0).coerceToText(this);
                    if (cs != null && cs.toString().trim().length() > 0) {
                        return cs.toString().trim();
                    }
                }
            }
        } catch (Throwable ignored) {
        }
        return "";
    }

    private void updateUiFromEngine(boolean isPlaying, boolean isLoading, int sentIdx, int totalSents, String currentSent, String voiceLabel, float speedMult, int paraIdx) {
        if (totalSents == 0 && !isPlaying && this.currentUiState != UI_STATE_SCAN_SELECT) {
            this.activeParagraphIndex = -1;
            detachScreenCanvasOverlay();
            if (this.currentUiState == UI_STATE_VERTICAL_PILL) {
                switchUiState(UI_STATE_IDLE_CIRCLE);
            }
        } else if (!this.currentBlocks.isEmpty() && paraIdx >= 0 && paraIdx < this.currentBlocks.size()) {
            this.activeParagraphIndex = paraIdx;
            if (this.screenCanvasView != null) {
                this.screenCanvasView.invalidate();
            }
        }

        if (this.verticalCircleSymbolView != null && this.verticalCircleHaloDrawable != null) {
            if (isPlaying) {
                this.verticalCircleSymbolView.setText("◉");
                this.verticalCircleSymbolView.setTextColor(Color.parseColor("#6EE7B7"));
                this.verticalCircleHaloDrawable.setColor(Color.parseColor("#384BA37E"));
                this.verticalCircleHaloDrawable.setStroke(dp(2), Color.parseColor("#6EE7B7"));
            } else {
                this.verticalCircleSymbolView.setText("▶");
                this.verticalCircleSymbolView.setTextColor(Color.parseColor("#FCD34D"));
                this.verticalCircleHaloDrawable.setColor(Color.parseColor("#28F59E0B"));
                this.verticalCircleHaloDrawable.setStroke(dp(2), Color.parseColor("#FCD34D"));
            }
        }

        if (this.statusHeaderTextView != null) {
            if (totalSents > 0) {
                String prefix = isPlaying ? "En lecture" : "En pause";
                if (!this.currentBlocks.isEmpty()) {
                    this.statusHeaderTextView.setText(
                            prefix + " · Paragraphe " + (this.activeParagraphIndex + 1) + "/" + this.currentBlocks.size()
                                    + " (Phr. " + (sentIdx + 1) + "/" + totalSents + ")"
                    );
                } else {
                    this.statusHeaderTextView.setText(
                            prefix + " · Phrase " + (sentIdx + 1) + "/" + totalSents
                    );
                }
            } else {
                this.statusHeaderTextView.setText("Prêt à scanner l’écran");
            }
        }

        if (this.playPauseConfigBtn != null) {
            this.playPauseConfigBtn.setText(isPlaying ? "⏸ Pause" : "▶ Lire");
        }

        int wpm = Math.round(175.0f * speedMult);
        if (this.wpmLabelView != null) {
            String formattedSpeed = String.format(Locale.US, "%.2f", speedMult)
                    .replaceAll("0+$", "")
                    .replaceAll("\\.$", "");
            this.wpmLabelView.setText("DÉBIT WPM : " + wpm + " mots/min (" + formattedSpeed + "×)");
        }

        refreshVoiceAndSpeedButtons(this.voiceEngine.getSelectedVoice().id, speedMult);
    }

    private void refreshVoiceAndSpeedButtons(String activeVoiceId, float activeSpeed) {
        for (int i = 0; i < this.voiceButtons.size(); i++) {
            TextView btn = this.voiceButtons.get(i);
            boolean selected = activeVoiceId.equals(btn.getTag());
            GradientDrawable bg = new GradientDrawable();
            bg.setCornerRadius(dp(10));
            if (selected) {
                bg.setColor(Color.parseColor("#1E4D3B"));
                bg.setStroke(dp(1), Color.parseColor("#6EE7B7"));
                btn.setTextColor(Color.WHITE);
            } else {
                bg.setColor(Color.parseColor("#22FFFFFF"));
                btn.setTextColor(Color.parseColor("#D1D5DB"));
            }
            btn.setBackground(bg);
        }

        for (int i = 0; i < this.speedButtons.size(); i++) {
            TextView btn = this.speedButtons.get(i);
            Float tagVal = (Float) btn.getTag();
            boolean selected = tagVal != null && Math.abs(tagVal - activeSpeed) < 0.04f;
            GradientDrawable bg = new GradientDrawable();
            bg.setCornerRadius(dp(8));
            if (selected) {
                bg.setColor(Color.parseColor("#1E4D3B"));
                bg.setStroke(dp(1), Color.parseColor("#6EE7B7"));
                btn.setTextColor(Color.WHITE);
            } else {
                bg.setColor(Color.parseColor("#22FFFFFF"));
                btn.setTextColor(Color.parseColor("#D1D5DB"));
            }
            btn.setBackground(bg);
        }
    }

    private void startHaloPulseAnimation() {
        this.pulseAnimator = ValueAnimator.ofFloat(0.88f, 1.08f);
        this.pulseAnimator.setDuration(1050L);
        this.pulseAnimator.setRepeatCount(ValueAnimator.INFINITE);
        this.pulseAnimator.setRepeatMode(ValueAnimator.REVERSE);
        this.pulseAnimator.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
            @Override
            public void onAnimationUpdate(ValueAnimator animation) {
                float scale = (Float) animation.getAnimatedValue();
                if (FishOverlayService.this.verticalCircleSymbolView == null
                        || FishOverlayService.this.voiceEngine == null
                        || !FishOverlayService.this.voiceEngine.isPlaying()) {
                    if (FishOverlayService.this.verticalCircleSymbolView != null) {
                        FishOverlayService.this.verticalCircleSymbolView.setScaleX(1.0f);
                        FishOverlayService.this.verticalCircleSymbolView.setScaleY(1.0f);
                    }
                    return;
                }
                FishOverlayService.this.verticalCircleSymbolView.setScaleX(scale);
                FishOverlayService.this.verticalCircleSymbolView.setScaleY(scale);
            }
        });
        this.pulseAnimator.start();
    }

    private void attachDragAndClickListener(View target, final Runnable onTap) {
        target.setOnTouchListener(new View.OnTouchListener() {
            private int initialX;
            private int initialY;
            private float touchX;
            private float touchY;
            private boolean moved;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                if (FishOverlayService.this.floatingParams == null || FishOverlayService.this.rootContainer == null) {
                    return false;
                }
                switch (event.getActionMasked()) {
                    case MotionEvent.ACTION_DOWN:
                        this.initialX = FishOverlayService.this.floatingParams.x;
                        this.initialY = FishOverlayService.this.floatingParams.y;
                        this.touchX = event.getRawX();
                        this.touchY = event.getRawY();
                        this.moved = false;
                        return true;

                    case MotionEvent.ACTION_UP:
                        if (!this.moved && onTap != null) {
                            onTap.run();
                            return true;
                        }
                        if (!this.moved) {
                            return true;
                        }
                        if (FishOverlayService.this.currentUiState != UI_STATE_IDLE_CIRCLE
                                && FishOverlayService.this.currentUiState != UI_STATE_VERTICAL_PILL) {
                            return true;
                        }
                        DisplayMetrics dm = FishOverlayService.this.getResources().getDisplayMetrics();
                        int centerX = FishOverlayService.this.floatingParams.x
                                + (FishOverlayService.this.rootContainer.getWidth() / 2);
                        if (centerX > dm.widthPixels / 2) {
                            FishOverlayService.this.floatingParams.x = Math.max(0, dm.widthPixels - FishOverlayService.this.dp(54));
                        } else {
                            FishOverlayService.this.floatingParams.x = FishOverlayService.this.dp(6);
                        }
                        try {
                            FishOverlayService.this.windowManager.updateViewLayout(
                                    FishOverlayService.this.rootContainer,
                                    FishOverlayService.this.floatingParams
                            );
                        } catch (Throwable ignored) {
                        }
                        return true;

                    case MotionEvent.ACTION_MOVE:
                        int dx = Math.round(event.getRawX() - this.touchX);
                        int dy = Math.round(event.getRawY() - this.touchY);
                        if (Math.abs(dx) > FishOverlayService.this.dp(7) || Math.abs(dy) > FishOverlayService.this.dp(7)) {
                            this.moved = true;
                        }
                        if (!this.moved) {
                            return true;
                        }
                        FishOverlayService.this.floatingParams.x = this.initialX + dx;
                        FishOverlayService.this.floatingParams.y = this.initialY + dy;
                        try {
                            FishOverlayService.this.windowManager.updateViewLayout(
                                    FishOverlayService.this.rootContainer,
                                    FishOverlayService.this.floatingParams
                            );
                        } catch (Throwable ignored) {
                        }
                        return true;

                    default:
                        return false;
                }
            }
        });
    }

    private class ScreenCanvasOverlayView extends View {
        private final Paint scrimPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint frameFillPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint frameStrokePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint activeFillPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint activeStrokePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint badgePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint badgeTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint bannerBgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint bannerBtnPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint scanLinePaint = new Paint(Paint.ANTI_ALIAS_FLAG);

        private final RectF bannerRect = new RectF();
        private final RectF readAllBtnRect = new RectF();
        private final RectF closeScanBtnRect = new RectF();

        ScreenCanvasOverlayView(Context context) {
            super(context);
            this.scrimPaint.setColor(Color.parseColor("#18000000"));

            this.frameFillPaint.setStyle(Paint.Style.FILL);
            this.frameFillPaint.setColor(Color.parseColor("#244BA37E"));

            this.frameStrokePaint.setStyle(Paint.Style.STROKE);
            this.frameStrokePaint.setStrokeWidth(FishOverlayService.this.dp(2));
            this.frameStrokePaint.setColor(Color.parseColor("#D94BA37E"));

            this.activeFillPaint.setStyle(Paint.Style.FILL);
            this.activeFillPaint.setColor(Color.parseColor("#284BA37E"));

            this.activeStrokePaint.setStyle(Paint.Style.STROKE);
            this.activeStrokePaint.setStrokeWidth(FishOverlayService.this.dp(3));
            this.activeStrokePaint.setColor(Color.parseColor("#1E4D3B"));

            this.badgePaint.setStyle(Paint.Style.FILL);
            this.badgePaint.setColor(Color.parseColor("#1E4D3B"));

            this.badgeTextPaint.setColor(Color.WHITE);
            this.badgeTextPaint.setTextSize(FishOverlayService.this.dp(11));
            this.badgeTextPaint.setTypeface(Typeface.DEFAULT_BOLD);
            this.badgeTextPaint.setTextAlign(Paint.Align.CENTER);

            this.bannerBgPaint.setStyle(Paint.Style.FILL);
            this.bannerBgPaint.setColor(Color.parseColor("#EC141311"));

            this.bannerBtnPaint.setStyle(Paint.Style.FILL);
            this.bannerBtnPaint.setColor(Color.parseColor("#1E4D3B"));

            this.scanLinePaint.setStyle(Paint.Style.FILL);
            this.scanLinePaint.setColor(Color.parseColor("#996EE7B7"));
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            int width = getWidth();
            int height = getHeight();

            if (FishOverlayService.this.scanBeamProgress >= 0.0f && FishOverlayService.this.scanBeamProgress <= 1.0f) {
                float beamY = FishOverlayService.this.scanBeamProgress * height;
                canvas.drawRect(
                        0.0f,
                        Math.max(0.0f, beamY - FishOverlayService.this.dp(18)),
                        width,
                        Math.min(height, beamY + FishOverlayService.this.dp(6)),
                        this.scanLinePaint
                );
            }

            if (FishOverlayService.this.currentUiState != UI_STATE_SCAN_SELECT) {
                if ((FishOverlayService.this.currentUiState == UI_STATE_VERTICAL_PILL
                        || FishOverlayService.this.currentUiState == UI_STATE_CONFIG_PANEL)
                        && FishOverlayService.this.activeParagraphIndex >= 0
                        && FishOverlayService.this.activeParagraphIndex < FishOverlayService.this.currentBlocks.size()) {
                    FishAccessibilityService.ScreenBlock active = FishOverlayService.this.currentBlocks.get(
                            FishOverlayService.this.activeParagraphIndex
                    );
                    RectF rect = new RectF(
                            Math.max(FishOverlayService.this.dp(4), active.bounds.left - FishOverlayService.this.dp(5)),
                            Math.max(FishOverlayService.this.dp(36), active.bounds.top - FishOverlayService.this.dp(4)),
                            Math.min(width - FishOverlayService.this.dp(4), active.bounds.right + FishOverlayService.this.dp(5)),
                            Math.min(height - FishOverlayService.this.dp(8), active.bounds.bottom + FishOverlayService.this.dp(4))
                    );
                    canvas.drawRoundRect(rect, FishOverlayService.this.dp(10), FishOverlayService.this.dp(10), this.activeFillPaint);
                    canvas.drawRoundRect(rect, FishOverlayService.this.dp(10), FishOverlayService.this.dp(10), this.activeStrokePaint);
                }
                return;
            }

            canvas.drawRect(0.0f, 0.0f, width, height, this.scrimPaint);

            for (int i = 0; i < FishOverlayService.this.currentBlocks.size(); i++) {
                FishAccessibilityService.ScreenBlock block = FishOverlayService.this.currentBlocks.get(i);
                RectF rect = new RectF(
                        Math.max(FishOverlayService.this.dp(6), block.bounds.left - FishOverlayService.this.dp(4)),
                        Math.max(FishOverlayService.this.dp(76), block.bounds.top - FishOverlayService.this.dp(3)),
                        Math.min(width - FishOverlayService.this.dp(6), block.bounds.right + FishOverlayService.this.dp(4)),
                        Math.min(height - FishOverlayService.this.dp(12), block.bounds.bottom + FishOverlayService.this.dp(3))
                );
                canvas.drawRoundRect(rect, FishOverlayService.this.dp(10), FishOverlayService.this.dp(10), this.frameFillPaint);
                canvas.drawRoundRect(rect, FishOverlayService.this.dp(10), FishOverlayService.this.dp(10), this.frameStrokePaint);

                float r = FishOverlayService.this.dp(11);
                float cx = rect.left + r + FishOverlayService.this.dp(4);
                float cy = rect.top + r + FishOverlayService.this.dp(4);
                canvas.drawCircle(cx, cy, r, this.badgePaint);
                canvas.drawText("▶ " + (i + 1), cx, cy + FishOverlayService.this.dp(4), this.badgeTextPaint);
            }

            this.bannerRect.set(
                    FishOverlayService.this.dp(12),
                    FishOverlayService.this.dp(38),
                    width - FishOverlayService.this.dp(12),
                    FishOverlayService.this.dp(86)
            );
            canvas.drawRoundRect(this.bannerRect, FishOverlayService.this.dp(16), FishOverlayService.this.dp(16), this.bannerBgPaint);

            this.badgeTextPaint.setTextAlign(Paint.Align.LEFT);
            this.badgeTextPaint.setTextSize(FishOverlayService.this.dp(12));
            canvas.drawText(
                    "Touchez un paragraphe encadré pour lire",
                    this.bannerRect.left + FishOverlayService.this.dp(14),
                    this.bannerRect.centerY() + FishOverlayService.this.dp(4),
                    this.badgeTextPaint
            );

            this.readAllBtnRect.set(
                    this.bannerRect.right - FishOverlayService.this.dp(126),
                    this.bannerRect.top + FishOverlayService.this.dp(8),
                    this.bannerRect.right - FishOverlayService.this.dp(44),
                    this.bannerRect.bottom - FishOverlayService.this.dp(8)
            );
            canvas.drawRoundRect(this.readAllBtnRect, FishOverlayService.this.dp(10), FishOverlayService.this.dp(10), this.bannerBtnPaint);

            this.badgeTextPaint.setTextAlign(Paint.Align.CENTER);
            this.badgeTextPaint.setTextSize(FishOverlayService.this.dp(11));
            canvas.drawText(
                    "▶ Tout lire",
                    this.readAllBtnRect.centerX(),
                    this.readAllBtnRect.centerY() + FishOverlayService.this.dp(4),
                    this.badgeTextPaint
            );

            this.closeScanBtnRect.set(
                    this.bannerRect.right - FishOverlayService.this.dp(38),
                    this.bannerRect.top + FishOverlayService.this.dp(8),
                    this.bannerRect.right - FishOverlayService.this.dp(8),
                    this.bannerRect.bottom - FishOverlayService.this.dp(8)
            );
            canvas.drawRoundRect(this.closeScanBtnRect, FishOverlayService.this.dp(10), FishOverlayService.this.dp(10), this.badgePaint);
            canvas.drawText(
                    "✕",
                    this.closeScanBtnRect.centerX(),
                    this.closeScanBtnRect.centerY() + FishOverlayService.this.dp(4),
                    this.badgeTextPaint
            );
        }

        @Override
        public boolean onTouchEvent(MotionEvent event) {
            if (FishOverlayService.this.currentUiState != UI_STATE_SCAN_SELECT) {
                return false;
            }
            if (event.getActionMasked() != MotionEvent.ACTION_UP) {
                return true;
            }
            float x = event.getX();
            float y = event.getY();

            if (this.closeScanBtnRect.contains(x, y)) {
                FishOverlayService.this.detachScreenCanvasOverlay();
                FishOverlayService.this.switchUiState(UI_STATE_IDLE_CIRCLE);
                return true;
            }
            if (this.readAllBtnRect.contains(x, y)) {
                FishOverlayService.this.startReadingFromParagraph(0);
                return true;
            }

            for (int i = 0; i < FishOverlayService.this.currentBlocks.size(); i++) {
                Rect b = FishOverlayService.this.currentBlocks.get(i).bounds;
                if (x >= b.left - FishOverlayService.this.dp(12)
                        && x <= b.right + FishOverlayService.this.dp(12)
                        && y >= b.top - FishOverlayService.this.dp(10)
                        && y <= b.bottom + FishOverlayService.this.dp(10)) {
                    FishOverlayService.this.startReadingFromParagraph(i);
                    return true;
                }
            }

            if (!FishOverlayService.this.currentBlocks.isEmpty()) {
                float bestDist = Float.MAX_VALUE;
                int bestIdx = 0;
                for (int i = 0; i < FishOverlayService.this.currentBlocks.size(); i++) {
                    float dist = Math.abs(y - FishOverlayService.this.currentBlocks.get(i).bounds.exactCenterY());
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestIdx = i;
                    }
                }
                if (bestDist < FishOverlayService.this.dp(90)) {
                    FishOverlayService.this.startReadingFromParagraph(bestIdx);
                    return true;
                }
            }

            FishOverlayService.this.detachScreenCanvasOverlay();
            FishOverlayService.this.switchUiState(UI_STATE_IDLE_CIRCLE);
            return true;
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
    public void onDestroy() {
        if (this.pulseAnimator != null) {
            try {
                this.pulseAnimator.cancel();
            } catch (Throwable ignored) {
            }
        }
        detachScreenCanvasOverlay();
        if (this.voiceEngine != null) {
            this.voiceEngine.shutdown();
        }
        if (this.rootContainer != null && this.windowManager != null) {
            try {
                this.windowManager.removeView(this.rootContainer);
            } catch (Throwable ignored) {
            }
            this.rootContainer = null;
        }
        super.onDestroy();
    }
}
