package app.fishreader.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import app.fishreader.R

// Fish Reader — jetons de design. Toujours le jeton, jamais la valeur en dur.

@Immutable
data class FrColors(
    val paper: Color, val paperRaised: Color, val ink: Color, val inkMuted: Color,
    val rule: Color, val accent: Color, val onAccent: Color, val highlight: Color, val danger: Color,
)

val Papier = FrColors(Color(0xFFF7F2E8), Color(0xFFFFFCF5), Color(0xFF2A241D), Color(0xFF6B6155), Color(0xFFE2D8C6), Color(0xFF1F5F63), Color(0xFFFFFCF5), Color(0xFFF3DC9A), Color(0xFFA3392B))
val Sepia = FrColors(Color(0xFFEFE3CC), Color(0xFFF6ECD9), Color(0xFF3B2F22), Color(0xFF6A5843), Color(0xFFD9C7A6), Color(0xFF1D5458), Color(0xFFFFFCF5), Color(0xFFE6C97F), Color(0xFF97342A))
val Nuit = FrColors(Color(0xFF1C1A17), Color(0xFF26231F), Color(0xFFECE4D6), Color(0xFFA89E8F), Color(0xFF3A352E), Color(0xFF7FB8B3), Color(0xFF1C1A17), Color(0xFF5A4A1F), Color(0xFFE08A7C))

enum class FrTheme { Papier, Sepia, Nuit }

// Polices : copier design-system/fonts/*.woff2 → res/font (convertir en .ttf si nécessaire)
val Literata = FontFamily(
    Font(R.font.literata_400, FontWeight.Normal), Font(R.font.literata_500, FontWeight.Medium), Font(R.font.literata_600, FontWeight.SemiBold),
)
val SourceSans3 = FontFamily(
    Font(R.font.source_sans_3_400, FontWeight.Normal), Font(R.font.source_sans_3_500, FontWeight.Medium), Font(R.font.source_sans_3_600, FontWeight.SemiBold),
)
private const val TNUM = "tnum"

@Immutable
data class FrType(
    val display: TextStyle = TextStyle(fontFamily = Literata, fontWeight = FontWeight.SemiBold, fontSize = 40.sp, lineHeight = 44.sp, letterSpacing = (-0.01).em),
    val title: TextStyle = TextStyle(fontFamily = Literata, fontWeight = FontWeight.SemiBold, fontSize = 26.sp, lineHeight = 32.sp),
    val headerTitle: TextStyle = TextStyle(fontFamily = Literata, fontWeight = FontWeight.SemiBold, fontSize = 20.sp, lineHeight = 24.sp),
    val wordmark: TextStyle = TextStyle(fontFamily = Literata, fontWeight = FontWeight.SemiBold, fontSize = 18.sp, lineHeight = 24.sp),
    val reading: TextStyle = TextStyle(fontFamily = Literata, fontSize = 19.sp, lineHeight = 30.sp), // réglable 16–24 sp
    val bigNumber: TextStyle = TextStyle(fontFamily = Literata, fontWeight = FontWeight.Medium, fontSize = 44.sp, lineHeight = 44.sp, fontFeatureSettings = TNUM),
    val stepperNumber: TextStyle = TextStyle(fontFamily = Literata, fontWeight = FontWeight.Medium, fontSize = 28.sp, lineHeight = 28.sp, fontFeatureSettings = TNUM),
    val uiLabel: TextStyle = TextStyle(fontFamily = SourceSans3, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, lineHeight = 20.sp, fontFeatureSettings = TNUM),
    val uiBody: TextStyle = TextStyle(fontFamily = SourceSans3, fontSize = 15.sp, lineHeight = 22.sp),
    val uiCaption: TextStyle = TextStyle(fontFamily = SourceSans3, fontSize = 13.sp, lineHeight = 18.sp, fontFeatureSettings = TNUM),
    val eyebrow: TextStyle = TextStyle(fontFamily = SourceSans3, fontWeight = FontWeight.SemiBold, fontSize = 12.sp, lineHeight = 18.sp, letterSpacing = 0.08.em), // + uppercase()
)

object FrSpace { val s1 = 4.dp; val s2 = 8.dp; val s3 = 12.dp; val s4 = 16.dp; val s6 = 24.dp; val s10 = 40.dp }
object FrRadius { val sm = 4.dp; val md = 8.dp; val lg = 14.dp; val segment = 6.dp; val pill = 999.dp }
object FrSize {
    val targetMin = 44.dp; val targetPrimary = 48.dp; val bubble = 56.dp; val playLarge = 64.dp
    val header = 52.dp; val tabBar = 60.dp; val player = 60.dp; val bubbleRing = 3.dp; val highlightSpread = 3.dp
}
object FrMotion { const val COLOR_MS = 150; const val SENTENCE_MS = 250; const val PROGRESS_MS = 300; const val SNAP_MS = 250 }

val SPEEDS = listOf(0.75f, 1.0f, 1.15f, 1.25f, 1.5f)
fun formatSpeed(v: Float): String = ("%.2f".format(v).trimEnd('0').trimEnd('.', ',')).replace('.', ',') + "×"

val LocalFrColors = staticCompositionLocalOf { Papier }
val LocalFrType = staticCompositionLocalOf { FrType() }

@Composable
fun FishReaderTheme(theme: FrTheme = FrTheme.Papier, content: @Composable () -> Unit) {
    val colors = when (theme) { FrTheme.Papier -> Papier; FrTheme.Sepia -> Sepia; FrTheme.Nuit -> Nuit }
    CompositionLocalProvider(LocalFrColors provides colors, LocalFrType provides FrType(), content = content)
}

object Fr {
    val colors: FrColors @Composable get() = LocalFrColors.current
    val type: FrType @Composable get() = LocalFrType.current
}
