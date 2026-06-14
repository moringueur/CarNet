package fr.gendarmerie.fichevehicule.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// Palette (reprise de la PWA)
val BleuNuit = Color(0xFF142142)
val Acier = Color(0xFF2D5BA8)
val Vert = Color(0xFF1B6E5F)
val Encre = Color(0xFF1A1F2E)
val Gris = Color(0xFF6E7684)
val Filet = Color(0xFFC8CDD6)
val Doux = Color(0xFFEEF1F5)
val RougeAvarie = Color(0xFF963232)

private fun schemeFor(accent: Color) = lightColorScheme(
    primary = BleuNuit,
    onPrimary = Color.White,
    secondary = accent,
    onSecondary = Color.White,
    tertiary = accent,
    background = Color(0xFFF6F8FB),
    onBackground = Encre,
    surface = Color.White,
    onSurface = Encre,
    surfaceVariant = Doux,
    onSurfaceVariant = Gris,
    outline = Filet,
    error = RougeAvarie,
)

@Composable
fun FicheVehiculeTheme(
    accent: Color = Acier,
    content: @Composable () -> Unit,
) {
    val colorScheme = schemeFor(accent)
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = BleuNuit.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }
    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography(),
        content = content,
    )
}
