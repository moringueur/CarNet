package fr.gendarmerie.fichevehicule.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.util.Base64
import androidx.exifinterface.media.ExifInterface
import fr.gendarmerie.fichevehicule.model.Photo
import java.io.ByteArrayOutputStream
import kotlin.math.max

/**
 * Décodage, redimensionnement (≤ 1280 px), correction EXIF et compression JPEG (~70).
 * Résultat : un [Photo] avec image en base64 + dimensions.
 */
object ImageUtils {

    private const val MAX_SIDE = 1280
    private const val JPEG_QUALITY = 70

    fun fromUri(context: Context, uri: Uri): Photo? {
        return try {
            // 1) Dimensions sans charger l'image complète.
            val opts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            context.contentResolver.openInputStream(uri)?.use {
                BitmapFactory.decodeStream(it, null, opts)
            }
            if (opts.outWidth <= 0 || opts.outHeight <= 0) return null

            // 2) inSampleSize pour un premier sous-échantillonnage.
            val sample = computeInSampleSize(opts.outWidth, opts.outHeight, MAX_SIDE)
            val decodeOpts = BitmapFactory.Options().apply { inSampleSize = sample }
            var bmp = context.contentResolver.openInputStream(uri)?.use {
                BitmapFactory.decodeStream(it, null, decodeOpts)
            } ?: return null

            // 3) Orientation EXIF.
            val orientation = context.contentResolver.openInputStream(uri)?.use { stream ->
                ExifInterface(stream).getAttributeInt(
                    ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL
                )
            } ?: ExifInterface.ORIENTATION_NORMAL
            bmp = applyExif(bmp, orientation)

            // 4) Redimensionnement final pour que le plus grand côté ≤ MAX_SIDE.
            bmp = scaleDown(bmp, MAX_SIDE)

            // 5) Encodage JPEG -> base64.
            val baos = ByteArrayOutputStream()
            bmp.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, baos)
            val b64 = Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP)
            Photo(jpegBase64 = b64, w = bmp.width, h = bmp.height)
        } catch (e: Exception) {
            null
        }
    }

    private fun computeInSampleSize(w: Int, h: Int, target: Int): Int {
        var sample = 1
        val biggest = max(w, h)
        while (biggest / sample > target * 2) sample *= 2
        return sample
    }

    private fun scaleDown(bmp: Bitmap, maxSide: Int): Bitmap {
        val biggest = max(bmp.width, bmp.height)
        if (biggest <= maxSide) return bmp
        val ratio = maxSide.toFloat() / biggest
        val nw = (bmp.width * ratio).toInt().coerceAtLeast(1)
        val nh = (bmp.height * ratio).toInt().coerceAtLeast(1)
        val scaled = Bitmap.createScaledBitmap(bmp, nw, nh, true)
        if (scaled != bmp) bmp.recycle()
        return scaled
    }

    private fun applyExif(bmp: Bitmap, orientation: Int): Bitmap {
        val m = Matrix()
        when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> m.postRotate(90f)
            ExifInterface.ORIENTATION_ROTATE_180 -> m.postRotate(180f)
            ExifInterface.ORIENTATION_ROTATE_270 -> m.postRotate(270f)
            ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> m.postScale(-1f, 1f)
            ExifInterface.ORIENTATION_FLIP_VERTICAL -> m.postScale(1f, -1f)
            ExifInterface.ORIENTATION_TRANSPOSE -> { m.postRotate(90f); m.postScale(-1f, 1f) }
            ExifInterface.ORIENTATION_TRANSVERSE -> { m.postRotate(270f); m.postScale(-1f, 1f) }
            else -> return bmp
        }
        val rotated = Bitmap.createBitmap(bmp, 0, 0, bmp.width, bmp.height, m, true)
        if (rotated != bmp) bmp.recycle()
        return rotated
    }
}
