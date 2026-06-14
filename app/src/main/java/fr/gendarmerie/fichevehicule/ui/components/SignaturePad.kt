package fr.gendarmerie.fichevehicule.ui.components

import android.graphics.Bitmap
import android.graphics.Paint
import android.util.Base64
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import fr.gendarmerie.fichevehicule.ui.theme.BleuNuit
import java.io.ByteArrayOutputStream

/**
 * Pad de signature au doigt. Capture les tracés et les exporte en PNG base64.
 * @param existingPng signature déjà enregistrée (affichée tant qu'on ne dessine pas).
 */
@Composable
fun SignaturePad(
    placeholder: String,
    existingPng: String?,
    onChanged: (String?) -> Unit,
    modifier: Modifier = Modifier,
) {
    val strokes = remember { mutableStateListOf<MutableList<Offset>>() }
    var canvasSize by remember { mutableStateOf(IntSize.Zero) }
    var hasExisting by remember(existingPng) { mutableStateOf(existingPng != null) }

    fun export() {
        if (canvasSize.width <= 0 || canvasSize.height <= 0) return
        if (strokes.isEmpty()) { onChanged(null); return }
        val bmp = Bitmap.createBitmap(canvasSize.width, canvasSize.height, Bitmap.Config.ARGB_8888)
        val c = android.graphics.Canvas(bmp)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = BleuNuit.toArgb()
            strokeWidth = 3f
            style = Paint.Style.STROKE
            strokeCap = Paint.Cap.ROUND
            strokeJoin = Paint.Join.ROUND
        }
        for (stroke in strokes) {
            if (stroke.size == 1) {
                c.drawPoint(stroke[0].x, stroke[0].y, paint)
            } else {
                val path = android.graphics.Path()
                path.moveTo(stroke[0].x, stroke[0].y)
                for (i in 1 until stroke.size) path.lineTo(stroke[i].x, stroke[i].y)
                c.drawPath(path, paint)
            }
        }
        val baos = ByteArrayOutputStream()
        bmp.compress(Bitmap.CompressFormat.PNG, 100, baos)
        bmp.recycle()
        onChanged(Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP))
    }

    Column(modifier.fillMaxWidth()) {
        Box(
            Modifier
                .fillMaxWidth()
                .height(120.dp)
                .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(10.dp))
                .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(10.dp))
                .pointerInput(Unit) {
                    detectDragGestures(
                        onDragStart = { offset ->
                            hasExisting = false
                            strokes.add(mutableListOf(offset))
                        },
                        onDrag = { change, _ ->
                            change.consume()
                            strokes.lastOrNull()?.add(change.position)
                        },
                        onDragEnd = { export() },
                    )
                },
            contentAlignment = Alignment.Center,
        ) {
            Canvas(
                Modifier
                    .fillMaxWidth()
                    .height(120.dp)
                    .padding(2.dp)
            ) {
                canvasSize = IntSize(size.width.toInt(), size.height.toInt())
                for (stroke in strokes) {
                    if (stroke.size < 2) continue
                    val path = Path().apply {
                        moveTo(stroke[0].x, stroke[0].y)
                        for (i in 1 until stroke.size) lineTo(stroke[i].x, stroke[i].y)
                    }
                    drawPath(path, color = BleuNuit, style = Stroke(width = 3f, cap = StrokeCap.Round))
                }
            }
            if (strokes.isEmpty() && !hasExisting) {
                Text(
                    placeholder,
                    color = MaterialTheme.colorScheme.outline,
                )
            }
            if (strokes.isEmpty() && hasExisting) {
                Text(
                    "Signature enregistrée — redessiner pour remplacer",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        TextButton(
            onClick = {
                strokes.clear()
                hasExisting = false
                onChanged(null)
            },
            modifier = Modifier.align(Alignment.End),
        ) {
            Text("Effacer")
        }
    }
}
