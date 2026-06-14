package fr.gendarmerie.fichevehicule.pdf

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import fr.gendarmerie.fichevehicule.model.Fiche
import fr.gendarmerie.fichevehicule.model.Item
import fr.gendarmerie.fichevehicule.model.Mouvement
import fr.gendarmerie.fichevehicule.model.Personne
import fr.gendarmerie.fichevehicule.model.Photo
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Génère le PDF A4 de la fiche, dessiné au Canvas (aucune lib tierce).
 * Page 1 = fiche ; pages suivantes = annexe photographique paginée.
 */
class FichePdfGenerator(private val context: Context) {

    private val PAGE_W = 595.28f
    private val PAGE_H = 841.89f
    private val MARGIN = 34f // ~12 mm
    private val contentW get() = PAGE_W - 2 * MARGIN
    private val contentRight get() = PAGE_W - MARGIN

    private fun accent(f: Fiche) =
        if (f.mouvement == Mouvement.PERCEPTION) PdfPalette.ACIER else PdfPalette.VERT

    fun generate(fiche: Fiche): File {
        // ---- Pré-calcul du nombre total de pages (pour le pied "Page x/y") ----
        val annexPlan = planAnnex(fiche)
        val totalPages = 1 + annexPlan.size

        val doc = PdfDocument()
        var pageNo = 1

        // ---- Page 1 : la fiche ----
        run {
            val info = PdfDocument.PageInfo.Builder(PAGE_W.toInt(), PAGE_H.toInt(), pageNo).create()
            val page = doc.startPage(info)
            drawFiche(page.canvas, fiche)
            drawFooter(page.canvas, pageNo, totalPages)
            doc.finishPage(page)
            pageNo++
        }

        // ---- Pages annexe ----
        for (planPage in annexPlan) {
            val info = PdfDocument.PageInfo.Builder(PAGE_W.toInt(), PAGE_H.toInt(), pageNo).create()
            val page = doc.startPage(info)
            drawAnnexPage(page.canvas, fiche, planPage)
            drawFooter(page.canvas, pageNo, totalPages)
            doc.finishPage(page)
            pageNo++
        }

        val file = File(context.cacheDir, fileName(fiche))
        FileOutputStream(file).use { doc.writeTo(it) }
        doc.close()
        return file
    }

    fun fileName(f: Fiche): String {
        val mvt = f.mouvement.name
        val immat = f.vehicule.immat.ifBlank { "SANS-IMMAT" }
            .replace(Regex("[^A-Za-z0-9-]"), "-")
        val d = (f.date.ifBlank { SimpleDateFormat("dd/MM/yyyy", Locale.FRANCE).format(Date()) })
            .replace("/", "-")
        return "Fiche_${mvt}_${immat}_$d.pdf"
    }

    // ========================= PAGE 1 : FICHE =========================

    private fun drawFiche(c: Canvas, f: Fiche) {
        val acc = accent(f)
        var y = MARGIN

        y = drawHeader(c, f, y, acc)
        y += 8f
        y = drawAccentTitle(c, f, y, acc)
        y += 8f
        y = drawDateLieu(c, f, y)
        y += 10f
        y = drawIdentification(c, f, y)
        y += 8f
        y = drawEtatGeneral(c, f, y, acc)
        y += 8f
        y = drawChecklists(c, f, y, acc)
        y += 8f
        y = drawAvaries(c, f, y)
        y += 6f
        y = drawObservations(c, f, y)
        y += 6f
        drawSignatures(c, f, y)
    }

    private fun drawHeader(c: Canvas, f: Fiche, top: Float, acc: Int): Float {
        val h = 50f
        PdfDraw.rectFill(c, MARGIN, top, contentW, h, PdfPalette.BLEU_NUIT, 4f)
        val titre = PdfDraw.fill(PdfPalette.BLANC, 13f, bold = true)
        PdfDraw.text(c, "GENDARMERIE NATIONALE", MARGIN + 12f, top + 8f, titre)
        val sub = PdfDraw.fill(PdfPalette.FILET, 7.5f)
        PdfDraw.multiline(c, f.unite, MARGIN + 12f, top + 26f, contentW * 0.55f, sub, 10f, maxLines = 2)

        // Cartouche perception / réintégration à droite
        val boxW = 92f
        val boxH = 16f
        val bx = contentRight - 12f - boxW
        drawCartouche(c, "PERCEPTION", bx, top + 9f, boxW, boxH, active = f.mouvement == Mouvement.PERCEPTION, acc)
        drawCartouche(c, "RÉINTÉGR.", bx, top + 9f + boxH + 4f, boxW, boxH, active = f.mouvement == Mouvement.REINTEGRATION, acc)
        return top + h
    }

    private fun drawCartouche(c: Canvas, label: String, x: Float, y: Float, w: Float, h: Float, active: Boolean, acc: Int) {
        if (active) PdfDraw.rectFill(c, x, y, w, h, acc, 3f)
        else PdfDraw.rectStroke(c, x, y, w, h, PdfPalette.FILET, 0.8f, 3f)
        val p = PdfDraw.fill(if (active) PdfPalette.BLANC else PdfPalette.FILET, 8.5f, bold = true)
        PdfDraw.textCentered(c, label, x + w / 2f, y + (h - 9f) / 2f, p)
    }

    private fun drawAccentTitle(c: Canvas, f: Fiche, top: Float, acc: Int): Float {
        val h = 24f
        PdfDraw.rectFill(c, MARGIN, top, contentW, h, acc, 4f)
        val p = PdfDraw.fill(PdfPalette.BLANC, 12f, bold = true)
        PdfDraw.textCentered(c, "FICHE DE PERCEPTION / RÉINTÉGRATION DE VÉHICULE", PAGE_W / 2f, top + 6f, p)
        return top + h
    }

    private fun drawDateLieu(c: Canvas, f: Fiche, top: Float): Float {
        val h = 22f
        PdfDraw.rectFill(c, MARGIN, top, contentW, h, PdfPalette.DOUX, 3f)
        val lbl = PdfDraw.fill(PdfPalette.GRIS, 8f, bold = true)
        val v = PdfDraw.fill(PdfPalette.ENCRE, 9f, bold = true)
        val mid = MARGIN + contentW / 2f
        PdfDraw.text(c, "DATE", MARGIN + 12f, top + 4f, lbl)
        PdfDraw.text(c, f.date.ifBlank { "—" }, MARGIN + 50f, top + 6f, v)
        PdfDraw.text(c, "LIEU", mid + 6f, top + 4f, lbl)
        PdfDraw.text(c, f.lieu.ifBlank { "—" }, mid + 40f, top + 6f, v)
        return top + h
    }

    private fun sectionBand(c: Canvas, title: String, top: Float): Float {
        val h = 16f
        PdfDraw.rectFill(c, MARGIN, top, contentW, h, PdfPalette.BLEU_NUIT, 2f)
        val p = PdfDraw.fill(PdfPalette.BLANC, 8.5f, bold = true)
        PdfDraw.text(c, title, MARGIN + 10f, top + 3.5f, p)
        return top + h
    }

    private fun drawField(c: Canvas, label: String, value: String, x: Float, top: Float, w: Float) {
        val lbl = PdfDraw.fill(PdfPalette.GRIS, 6.5f, bold = true)
        val v = PdfDraw.fill(PdfPalette.ENCRE, 9f)
        PdfDraw.text(c, label.uppercase(Locale.FRANCE), x, top, lbl)
        PdfDraw.multiline(c, value.ifBlank { "—" }, x, top + 9f, w, v, 11f, maxLines = 1)
    }

    private fun drawIdentification(c: Canvas, f: Fiche, top: Float): Float {
        var y = sectionBand(c, "1 · IDENTIFICATION DU VÉHICULE", top)
        y += 6f
        val colW = contentW / 3f
        val x0 = MARGIN + 4f
        val rowH = 26f
        val v = f.vehicule
        // ligne 1
        drawField(c, "Marque / modèle", v.marque, x0, y, colW - 8f)
        drawField(c, "Immatriculation", v.immat, x0 + colW, y, colW - 8f)
        drawField(c, "N° de parc", v.parc, x0 + 2 * colW, y, colW - 8f)
        y += rowH
        // ligne 2
        drawField(c, "Catégorie / type", v.categorie, x0, y, colW - 8f)
        drawField(c, "Énergie", v.energie, x0 + colW, y, colW - 8f)
        drawField(c, "Kilométrage", v.km, x0 + 2 * colW, y, colW - 8f)
        y += rowH - 4f
        PdfDraw.rectStroke(c, MARGIN, top + 16f, contentW, y - (top + 16f), PdfPalette.FILET, 0.8f)
        return y
    }

    private fun drawEtatGeneral(c: Canvas, f: Fiche, top: Float, acc: Int): Float {
        var y = sectionBand(c, "2 · ÉTAT GÉNÉRAL", top)
        val frameTop = y
        y += 6f
        val x0 = MARGIN + 4f
        val half = contentW / 2f
        drawField(c, "Propreté extérieure", f.exterieurPropre, x0, y, half - 8f)
        drawField(c, "Propreté intérieure", f.interieurPropre, x0 + half, y, half - 8f)
        y += 24f

        // Jauge carburant segmentée 5 cases
        val lbl = PdfDraw.fill(PdfPalette.GRIS, 6.5f, bold = true)
        PdfDraw.text(c, "NIVEAU CARBURANT", x0, y, lbl)
        val niveaux = listOf("Vide", "1/4", "1/2", "3/4", "Plein")
        val activeIdx = niveaux.indexOf(f.vehicule.carburant).let { if (it < 0) 4 else it }
        val gy = y + 9f
        val cellW = 30f
        val cellH = 12f
        var gx = x0
        for (i in niveaux.indices) {
            val on = i <= activeIdx
            if (on) PdfDraw.rectFill(c, gx, gy, cellW, cellH, acc, 2f)
            else PdfDraw.rectStroke(c, gx, gy, cellW, cellH, PdfPalette.FILET, 0.8f, 2f)
            val tp = PdfDraw.fill(if (on) PdfPalette.BLANC else PdfPalette.GRIS, 6.5f, bold = true)
            PdfDraw.textCentered(c, niveaux[i], gx + cellW / 2f, gy + 2.5f, tp)
            gx += cellW + 4f
        }
        y += 26f

        // Pneus : 5 cases
        PdfDraw.text(c, "PNEUMATIQUES", x0, y, lbl)
        val py = y + 9f
        val pneus = listOf(
            "AVG" to f.pneus.avg, "AVD" to f.pneus.avd, "ARG" to f.pneus.arg,
            "ARD" to f.pneus.ard, "Secours" to f.pneus.sec,
        )
        val pw = (contentW - 8f - 4 * 4f) / 5f
        var px = x0
        for ((pos, etat) in pneus) {
            PdfDraw.rectStroke(c, px, py, pw, 24f, PdfPalette.FILET, 0.8f, 2f)
            val pp = PdfDraw.fill(PdfPalette.ENCRE, 7f, bold = true)
            PdfDraw.textCentered(c, pos, px + pw / 2f, py + 3f, pp)
            val col = when (etat) {
                "À remplacer" -> PdfPalette.ROUGE
                "Usé" -> PdfPalette.ORANGE
                else -> PdfPalette.VERT
            }
            PdfDraw.textCentered(c, etat, px + pw / 2f, py + 13f, PdfDraw.fill(col, 6.5f, bold = true))
            px += pw + 4f
        }
        y += 30f
        PdfDraw.rectStroke(c, MARGIN, frameTop, contentW, y - frameTop, PdfPalette.FILET, 0.8f)
        return y
    }

    private fun drawChecklists(c: Canvas, f: Fiche, top: Float, acc: Int): Float {
        val half = contentW / 2f
        // Deux bandeaux côte à côte (documents à gauche, équipements à droite).
        PdfDraw.rectFill(c, MARGIN, top, half - 4f, 16f, PdfPalette.BLEU_NUIT, 2f)
        PdfDraw.rectFill(c, MARGIN + half + 4f, top, half - 4f, 16f, PdfPalette.BLEU_NUIT, 2f)
        val bt = PdfDraw.fill(PdfPalette.BLANC, 8f, bold = true)
        PdfDraw.text(c, "3 · DOCUMENTS DE BORD", MARGIN + 8f, top + 3.5f, bt)
        PdfDraw.text(c, "4 · ÉQUIPEMENTS / DOTATION", MARGIN + half + 12f, top + 3.5f, bt)

        var yL = top + 16f + 5f
        var yR = top + 16f + 5f
        for (item in f.documents) {
            yL = checkRow(c, item, MARGIN + 6f, yL, half - 16f, acc)
        }
        for (item in f.equipements) {
            yR = checkRow(c, item, MARGIN + half + 10f, yR, half - 18f, acc)
        }
        val bottom = maxOf(yL, yR) + 3f
        PdfDraw.rectStroke(c, MARGIN, top + 16f, half - 4f, bottom - (top + 16f), PdfPalette.FILET, 0.8f)
        PdfDraw.rectStroke(c, MARGIN + half + 4f, top + 16f, half - 4f, bottom - (top + 16f), PdfPalette.FILET, 0.8f)
        return bottom
    }

    private fun checkRow(c: Canvas, item: Item, x: Float, top: Float, w: Float, acc: Int): Float {
        val box = 8f
        if (item.present) {
            PdfDraw.rectFill(c, x, top, box, box, acc, 1.5f)
            val chk = PdfDraw.fill(PdfPalette.BLANC, 7f, bold = true)
            PdfDraw.textCentered(c, "✓", x + box / 2f, top + 0.5f, chk)
        } else {
            PdfDraw.rectStroke(c, x, top, box, box, PdfPalette.FILET, 0.8f, 1.5f)
        }
        val tp = PdfDraw.fill(if (item.present) PdfPalette.ENCRE else PdfPalette.GRIS, 7.5f)
        PdfDraw.text(c, item.label, x + box + 5f, top - 1.5f, tp)
        return top + 13.5f
    }

    private fun drawAvaries(c: Canvas, f: Fiche, top: Float): Float {
        var y = sectionBand(c, "5 · AVARIES / ANOMALIES", top)
        y += 4f
        val txt = f.avaries.ifBlank { "Néant." }
        val p = PdfDraw.fill(PdfPalette.ROUGE, 8.5f)
        val boxTop = y
        y = PdfDraw.multiline(c, txt, MARGIN + 8f, y + 4f, contentW - 16f, p, 11f, maxLines = 4)
        y += 4f
        PdfDraw.rectStroke(c, MARGIN, boxTop, contentW, y - boxTop, PdfPalette.FILET, 0.8f)
        return y
    }

    private fun drawObservations(c: Canvas, f: Fiche, top: Float): Float {
        var y = sectionBand(c, "6 · OBSERVATIONS", top)
        y += 4f
        val txt = f.observations.ifBlank { "—" }
        val p = PdfDraw.fill(PdfPalette.ENCRE, 8.5f)
        val boxTop = y
        y = PdfDraw.multiline(c, txt, MARGIN + 8f, y + 4f, contentW - 16f, p, 11f, maxLines = 3)
        y += 4f
        PdfDraw.rectStroke(c, MARGIN, boxTop, contentW, y - boxTop, PdfPalette.FILET, 0.8f)
        return y
    }

    private fun drawSignatures(c: Canvas, f: Fiche, top: Float) {
        sectionBand(c, "7 · CONSTATATION CONTRADICTOIRE", top)
        val y = top + 16f + 5f
        val half = contentW / 2f
        drawPersonBlock(c, "CÉDANT", f.cedant, MARGIN, y, half - 6f)
        drawPersonBlock(c, "PRENEUR", f.preneur, MARGIN + half + 6f, y, half - 6f)
    }

    private fun drawPersonBlock(c: Canvas, titre: String, p: Personne, x: Float, top: Float, w: Float) {
        val tp = PdfDraw.fill(PdfPalette.BLEU_NUIT, 8f, bold = true)
        var y = PdfDraw.text(c, titre, x + 4f, top, tp)
        y += 2f
        val lbl = PdfDraw.fill(PdfPalette.GRIS, 6.5f)
        val v = PdfDraw.fill(PdfPalette.ENCRE, 8f)
        PdfDraw.text(c, "Grade : ${p.grade.ifBlank { "—" }}", x + 4f, y, v)
        y += 11f
        PdfDraw.text(c, "Nom : ${p.nom.ifBlank { "—" }}", x + 4f, y, v)
        y += 11f
        PdfDraw.multiline(c, "Unité : ${p.unite.ifBlank { "—" }}", x + 4f, y, w - 8f, lbl, 9f, maxLines = 2)
        y += 20f

        // Cadre de signature
        val sigH = 50f
        PdfDraw.rectStroke(c, x, y, w, sigH, PdfPalette.FILET, 0.8f, 3f)
        val bmp: Bitmap? = p.signaturePng?.let { PdfDraw.decodeBase64(it) }
        if (bmp != null) {
            PdfDraw.imageFit(c, bmp, x + 4f, y + 4f, w - 8f, sigH - 8f)
        } else {
            val ph = PdfDraw.fill(PdfPalette.FILET, 8f)
            PdfDraw.textCentered(c, "Signature", x + w / 2f, y + sigH / 2f - 5f, ph)
        }
    }

    private fun drawFooter(c: Canvas, page: Int, total: Int) {
        val y = PAGE_H - MARGIN + 8f
        PdfDraw.rectStroke(c, MARGIN, PAGE_H - MARGIN, contentW, 0f, PdfPalette.FILET, 0.8f)
        val now = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.FRANCE).format(Date())
        val p = PdfDraw.fill(PdfPalette.GRIS, 7f)
        PdfDraw.text(c, "Fiche générée le $now — Document interne", MARGIN, y, p)
        PdfDraw.textRight(c, "Page $page/$total", contentRight, y, p)
    }

    // ========================= ANNEXE PHOTOS =========================

    /** Un élément à placer dans l'annexe. */
    private sealed class AnnexElem(val height: Float) {
        class SubTitle(val text: String, h: Float) : AnnexElem(h)
        class Row(val left: Photo, val right: Photo?, h: Float) : AnnexElem(h)
    }

    private val ANNEX_HEADER_H = 40f
    private val SUBTITLE_H = 18f
    private val PHOTO_GAP = 12f
    private val ROW_GAP = 10f
    private val photoCellW get() = (contentW - PHOTO_GAP) / 2f
    private val photoImgH get() = photoCellW * 0.62f
    private val photoCellH get() = photoImgH + 22f // image + légende + marges

    private fun annexTop() = MARGIN + ANNEX_HEADER_H + 10f
    private fun annexBottom() = PAGE_H - MARGIN - 18f

    /** Construit la liste plate d'éléments de l'annexe. */
    private fun buildElems(f: Fiche): List<AnnexElem> {
        val elems = ArrayList<AnnexElem>()
        if (f.photosGenerales.isNotEmpty()) {
            elems.add(AnnexElem.SubTitle("VUES GÉNÉRALES (${f.photosGenerales.size})", SUBTITLE_H))
            elems.addAll(toRows(f.photosGenerales))
        }
        if (f.photosAvaries.isNotEmpty()) {
            elems.add(AnnexElem.SubTitle("AVARIES / RAYURES (${f.photosAvaries.size})", SUBTITLE_H))
            elems.addAll(toRows(f.photosAvaries))
        }
        return elems
    }

    private fun toRows(photos: List<Photo>): List<AnnexElem.Row> {
        val rows = ArrayList<AnnexElem.Row>()
        var i = 0
        while (i < photos.size) {
            val left = photos[i]
            val right = photos.getOrNull(i + 1)
            rows.add(AnnexElem.Row(left, right, photoCellH))
            i += 2
        }
        return rows
    }

    /** Plan : liste de pages, chaque page = liste d'éléments à dessiner. */
    private fun planAnnex(f: Fiche): List<List<AnnexElem>> {
        val elems = buildElems(f)
        if (elems.isEmpty()) return emptyList()
        val pages = ArrayList<MutableList<AnnexElem>>()
        var current = ArrayList<AnnexElem>()
        var y = annexTop()
        val bottom = annexBottom()

        var idx = 0
        while (idx < elems.size) {
            val e = elems[idx]
            // Empêcher un sous-titre orphelin : il faut que le titre + 1re ligne tiennent.
            if (e is AnnexElem.SubTitle) {
                val next = elems.getOrNull(idx + 1)
                val needed = e.height + (if (next is AnnexElem.Row) next.height + ROW_GAP else 0f)
                if (y + needed > bottom && current.isNotEmpty()) {
                    pages.add(current); current = ArrayList(); y = annexTop()
                }
                current.add(e); y += e.height + 4f
                idx++
                continue
            }
            // Row
            val h = e.height + ROW_GAP
            if (y + h > bottom && current.isNotEmpty()) {
                pages.add(current); current = ArrayList(); y = annexTop()
            }
            current.add(e); y += h
            idx++
        }
        if (current.isNotEmpty()) pages.add(current)
        return pages
    }

    private fun drawAnnexPage(c: Canvas, f: Fiche, elems: List<AnnexElem>) {
        val acc = accent(f)
        // En-tête
        PdfDraw.rectFill(c, MARGIN, MARGIN, contentW, ANNEX_HEADER_H, PdfPalette.BLEU_NUIT, 4f)
        val t = PdfDraw.fill(PdfPalette.BLANC, 12f, bold = true)
        PdfDraw.text(c, "ANNEXE PHOTOGRAPHIQUE", MARGIN + 12f, MARGIN + 12f, t)
        val r = PdfDraw.fill(PdfPalette.FILET, 8f, bold = true)
        val mvt = if (f.mouvement == Mouvement.PERCEPTION) "Perception" else "Réintégration"
        PdfDraw.textRight(c, "${f.vehicule.immat.ifBlank { "—" }} · $mvt", contentRight - 12f, MARGIN + 14f, r)

        var y = annexTop()
        var genCounter = 0
        var avCounter = 0
        var inAvaries = false
        for (e in elems) {
            when (e) {
                is AnnexElem.SubTitle -> {
                    inAvaries = e.text.startsWith("AVARIES")
                    PdfDraw.rectFill(c, MARGIN, y, contentW, SUBTITLE_H - 3f, acc, 2f)
                    val sp = PdfDraw.fill(PdfPalette.BLANC, 8.5f, bold = true)
                    PdfDraw.text(c, e.text, MARGIN + 10f, y + 2.5f, sp)
                    y += e.height + 4f
                }
                is AnnexElem.Row -> {
                    if (inAvaries) {
                        avCounter = drawPhotoCell(c, e.left, MARGIN, y, "Avarie", avCounter, true)
                        e.right?.let { avCounter = drawPhotoCell(c, it, MARGIN + photoCellW + PHOTO_GAP, y, "Avarie", avCounter, true) }
                    } else {
                        genCounter = drawPhotoCell(c, e.left, MARGIN, y, "Vue", genCounter, false)
                        e.right?.let { genCounter = drawPhotoCell(c, it, MARGIN + photoCellW + PHOTO_GAP, y, "Vue", genCounter, false) }
                    }
                    y += e.height + ROW_GAP
                }
            }
        }
    }

    /** Dessine une cellule photo et renvoie le compteur incrémenté. */
    private fun drawPhotoCell(c: Canvas, photo: Photo, x: Float, y: Float, prefix: String, counter: Int, avarie: Boolean): Int {
        val n = counter + 1
        PdfDraw.rectStroke(c, x, y, photoCellW, photoCellH, PdfPalette.FILET, 0.8f, 3f)
        val bmp = PdfDraw.decodeBase64(photo.jpegBase64)
        if (bmp != null) {
            PdfDraw.imageFit(c, bmp, x + 4f, y + 4f, photoCellW - 8f, photoImgH)
        } else {
            PdfDraw.rectFill(c, x + 4f, y + 4f, photoCellW - 8f, photoImgH, PdfPalette.DOUX, 2f)
        }
        val legende = photo.legende.ifBlank { "$prefix $n" }
        val col = if (avarie) PdfPalette.ROUGE else PdfPalette.ENCRE
        PdfDraw.multiline(c, legende, x + 6f, y + photoImgH + 7f, photoCellW - 12f, PdfDraw.fill(col, 7.5f), 9f, maxLines = 1)
        return n
    }
}
