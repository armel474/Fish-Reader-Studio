package app.fishreadv2;

import android.accessibilityservice.AccessibilityService;
import android.graphics.Bitmap;
import android.graphics.Rect;
import android.hardware.HardwareBuffer;
import android.os.Build;
import android.view.Display;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/** On-device OCR. Captures are held in memory and never saved or uploaded. */
final class ScreenOcrScanner {
    private final AccessibilityService service;
    private final TextRecognizer recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
    private boolean closed;

    ScreenOcrScanner(AccessibilityService service) {
        this.service = service;
    }

    void capture(FishAccessibilityService.CaptureCallback callback) {
        if (closed) return;
        if (Build.VERSION.SDK_INT < 30) {
            callback.onFailure("La reconnaissance visuelle nécessite Android 11 ou une version plus récente.");
            return;
        }
        try {
            service.takeScreenshot(Display.DEFAULT_DISPLAY, service.getMainExecutor(),
                    new AccessibilityService.TakeScreenshotCallback() {
                @Override
                public void onSuccess(AccessibilityService.ScreenshotResult result) {
                    Bitmap image = null;
                    HardwareBuffer buffer = result.getHardwareBuffer();
                    Bitmap hardware = null;
                    try {
                        hardware = Bitmap.wrapHardwareBuffer(buffer, result.getColorSpace());
                        if (hardware != null) image = hardware.copy(Bitmap.Config.ARGB_8888, false);
                    } catch (RuntimeException error) {
                        // Report below after releasing the hardware buffer.
                    } finally {
                        if (hardware != null) hardware.recycle();
                        buffer.close();
                    }
                    if (closed) {
                        if (image != null) image.recycle();
                        return;
                    }
                    if (image == null) {
                        callback.onFailure("Impossible de préparer la capture de cet écran.");
                        return;
                    }
                    recognize(image, callback);
                }

                @Override
                public void onFailure(int code) {
                    if (!closed) callback.onFailure(
                            "Capture indisponible sur cet écran (" + code
                            + "). L’application peut protéger son contenu ; réessayez ou utilisez Partager le texte.");
                }
            });
        } catch (RuntimeException error) {
            callback.onFailure("Impossible de capturer l’écran. Vérifiez puis réactivez le service d’accessibilité FishReader.");
        }
    }

    private void recognize(Bitmap bitmap, FishAccessibilityService.CaptureCallback callback) {
        try {
            recognizer.process(InputImage.fromBitmap(bitmap, 0))
                    .addOnSuccessListener(text -> {
                        if (closed) return;
                        List<FishAccessibilityService.ScreenBlock> blocks = new ArrayList<>();
                        for (Text.TextBlock block : text.getTextBlocks()) {
                            Rect bounds = block.getBoundingBox();
                            String content = FishAccessibilityService.cleanSocialHeaderPrefix(block.getText());
                            if (bounds != null && !bounds.isEmpty()
                                    && !FishAccessibilityService.isUiNoiseBlock(content)) {
                                blocks.add(new FishAccessibilityService.ScreenBlock(content, bounds,
                                        FishAccessibilityService.splitIntoSentences(content)));
                            }
                        }
                        blocks.sort(Comparator.comparingInt((FishAccessibilityService.ScreenBlock b) -> b.bounds.top)
                                .thenComparingInt(b -> b.bounds.left));
                        if (blocks.isEmpty()) callback.onFailure("Aucun texte lisible détecté sur cet écran.");
                        else callback.onCaptured(blocks);
                    })
                    .addOnFailureListener(error -> {
                        if (!closed) callback.onFailure("La reconnaissance du texte a échoué. Réessayez le scan.");
                    })
                    .addOnCompleteListener(task -> bitmap.recycle());
        } catch (RuntimeException error) {
            bitmap.recycle();
            if (!closed) callback.onFailure("Impossible de démarrer la reconnaissance du texte.");
        }
    }

    void close() {
        closed = true;
        recognizer.close();
    }
}
