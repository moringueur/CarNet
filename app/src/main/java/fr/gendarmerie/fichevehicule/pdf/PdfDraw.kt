package fr.gendarmerie.fichevehicule.pdf

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.Typeface
import android.util.Base64

/**
 * Petites primitives de dessin réutilisées par le générateur PDF.
 * Tout est en points PostScript (1 pt = 1/72 pouce).
 */
object PdfDraw {

    val sans: Typeface = Typeface.create("sans-serif", Typeface.NORMAL)
    val sansBold: Typeface = Typeface.create("sans-serif", Typeface.BOLD)
    val sansMedium: Typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)

    fun fill(color: Int, size: Float = 9f, bold: Boolean = false): Paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color
        textSize = size
        typeface = if (bold) sansBold else sans
        style = Paint.Style.FILL
    }

    fun stroke(color: Int, width: Float = 0.8f): Paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color
        strokeWidth = width
        style = Paint.Style.STROKE
    }

    fun rectFill(c: Canvas, x: Float, y: Float, w: Float, h: Float, color: Int, radius: Float = 0f) {
        val p = Paint(Paint.ANTI_ALIAS_FLAG).apply { this.color = color; style = Paint.Style.FILL }
        if (radius > 0f) c.drawRoundRect(RectF(x, y, x + w, y + h), radius, radius, p)
        else c.drawRect(x, y, x + w, y + h, p)
    }

    fun rectStroke(c: Canvas, x: Float, y: Float, w: Float, h: Float, color: Int, width: Float = 0.8f, radius: Float = 0f) {
        val p = stroke(color, width)
        if (radius > 0f) c.drawRoundRect(RectF(x, y, x + w, y + h), radius, radius, p)
        else c.drawRect(x, y, x + w, y + h, p)
    }

    /** Texte simple aligné à gauche (baseline calculée depuis le haut). */
    fun text(c: Canvas, s: String, x: Float, top: Float, paint: Paint): Float {
        val fm = paint.fontMetrics
        c.drawText(s, x, top - fm.ascent, paint)
        return top + (fm.descent - fm.ascent)
    }

    fun textCentered(c: Canvas, s: String, cx: Float, top: Float, paint: Paint): Float {
        val saved = paint.textAlign
        paint.textAlign = Paint.Align.CENTER
        val fm = paint.fontMetrics
        c.drawText(s, cx, top - fm.ascent, paint)
        paint.textAlign = saved
        return top + (fm.descent - fm.ascent)
    }

    fun textRight(c: Canvas, s: String, right: Float, top: Float, paint: Paint): Float {
        val saved = paint.textAlign
        paint.textAlign = Paint.Align.RIGHT
        val fm = paint.fontMetrics
        c.drawText(s, right, top - fm.ascent, paint)
        paint.textAlign = saved
        return top + (fm.descent - fm.ascent)
    }

    /** Découpe un texte (gère les \n explicites) en lignes tenant dans maxWidth. */
    fun wrap(s: String, paint: Paint, maxWidth: Float): List<String> {
        val out = ArrayList<String>()
        for (raw in s.split("\n")) {
            if (raw.isEmpty()) { out.add(""); continue }
            var line = StringBuilder()
            for (word in raw.split(" ")) {
                val candidate = if (line.isEmpty()) word else "$line $word"
                if (paint.measureText(candidate) <= maxWidth) {
                    line = StringBuilder(candidate)
                } else {
                    if (line.isNotEmpty()) out.add(line.toString())
                    // mot trop long : coupe brutalement
                    if (paint.measureText(word) > maxWidth) {
                        var chunk = StringBuilder()
                        for (ch in word) {
                            if (paint.measureText(chunk.toString() + ch) > maxWidth && chunk.isNotEmpty()) {
                                out.add(chunk.toString()); chunk = StringBuilder()
                            }
                            chunk.append(ch)
                        }
                        line = chunk
                    } else {
                        line = StringBuilder(word)
                    }
                }
            }
            out.add(line.toString())
        }
        return out
    }

    /** Dessine un texte multi-lignes ; retourne le y après la dernière ligne. */
    fun multiline(
        c: Canvas, s: String, x: Float, top: Float, maxWidth: Float, paint: Paint,
        lineHeight: Float, maxLines: Int = Int.MAX_VALUE,
    ): Float {
        val lines = wrap(s, paint, maxWidth)
        var y = top
        var count = 0
        for (l in lines) {
            if (count >= maxLines) break
            text(c, l, x, y, paint)
            y += lineHeight
            count++
        }
        return y
    }

    fun decodeBase64(b64: String): Bitmap? = try {
        val clean = if (b64.contains(",")) b64.substringAfter(",") else b64
        val bytes = Base64.decode(clean, Base64.DEFAULT)
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
    } catch (e: Exception) {
        null
    }

    /** Dessine un bitmap centré dans le rectangle en conservant le ratio. */
    fun imageFit(c: Canvas, bmp: Bitmap, x: Float, y: Float, w: Float, h: Float) {
        val iw = bmp.width.toFloat()
        val ih = bmp.height.toFloat()
        if (iw <= 0 || ih <= 0) return
        val scale = minOf(w / iw, h / ih)
        val dw = iw * scale
        val dh = ih * scale
        val dx = x + (w - dw) / 2f
        val dy = y + (h - dh) / 2f
        val dst = RectF(dx, dy, dx + dw, dy + dh)
        c.drawBitmap(bmp, Rect(0, 0, bmp.width, bmp.height), dst, Paint(Paint.FILTER_BITMAP_FLAG))
    }
}
