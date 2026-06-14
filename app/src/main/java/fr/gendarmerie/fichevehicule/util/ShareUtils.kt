package fr.gendarmerie.fichevehicule.util

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import java.io.File

/** Partage du PDF par mail (ACTION_SEND) et ouverture (ACTION_VIEW). */
object ShareUtils {

    private fun uriFor(context: Context, file: File): Uri =
        FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)

    /** Sépare la zone de texte des destinataires (`,` `;` ou retour ligne). */
    fun parseEmails(raw: String): Array<String> =
        raw.split(',', ';', '\n', '\r')
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .toTypedArray()

    fun sendMail(context: Context, pdf: File, destinataires: String, objet: String, corps: String) {
        val uri = uriFor(context, pdf)
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "application/pdf"
            putExtra(Intent.EXTRA_EMAIL, parseEmails(destinataires))
            putExtra(Intent.EXTRA_SUBJECT, objet)
            putExtra(Intent.EXTRA_TEXT, corps)
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        val chooser = Intent.createChooser(intent, "Envoyer la fiche par mail")
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(chooser)
    }

    fun openPdf(context: Context, pdf: File) {
        val uri = uriFor(context, pdf)
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/pdf")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        val chooser = Intent.createChooser(intent, "Ouvrir le PDF")
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(chooser)
    }
}
