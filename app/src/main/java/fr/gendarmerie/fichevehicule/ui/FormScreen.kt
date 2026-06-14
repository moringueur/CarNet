package fr.gendarmerie.fichevehicule.ui

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import fr.gendarmerie.fichevehicule.model.Defaults
import fr.gendarmerie.fichevehicule.model.Mouvement
import fr.gendarmerie.fichevehicule.model.Photo
import fr.gendarmerie.fichevehicule.pdf.FichePdfGenerator
import fr.gendarmerie.fichevehicule.ui.components.Checklist
import fr.gendarmerie.fichevehicule.ui.components.Dropdown
import fr.gendarmerie.fichevehicule.ui.components.LabeledTextField
import fr.gendarmerie.fichevehicule.ui.components.PhotoGallery
import fr.gendarmerie.fichevehicule.ui.components.PillSelector
import fr.gendarmerie.fichevehicule.ui.components.SectionCard
import fr.gendarmerie.fichevehicule.ui.components.SegmentedToggle
import fr.gendarmerie.fichevehicule.ui.components.SignaturePad
import fr.gendarmerie.fichevehicule.ui.components.TyreGrid
import fr.gendarmerie.fichevehicule.util.ShareUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

private enum class PhotoTarget { GENERALE, AVARIE }

@Composable
fun FormScreen(vm: FicheViewModel) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val fiche by vm.fiche.collectAsStateWithLifecycle()
    val settings by vm.settings.collectAsStateWithLifecycle()
    val ready by vm.ready.collectAsStateWithLifecycle()

    var showSettings by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    var photoTarget by remember { mutableStateOf(PhotoTarget.GENERALE) }
    var cameraUri by remember { mutableStateOf<Uri?>(null) }

    fun toast(msg: String) = Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()

    fun addPhoto(target: PhotoTarget, photo: Photo) {
        vm.update { f ->
            when (target) {
                PhotoTarget.GENERALE -> f.copy(photosGenerales = f.photosGenerales + photo)
                PhotoTarget.AVARIE -> f.copy(photosAvaries = f.photosAvaries + photo)
            }
        }
    }

    fun processUris(target: PhotoTarget, uris: List<Uri>) {
        if (uris.isEmpty()) return
        scope.launch {
            busy = true
            val photos = withContext(Dispatchers.IO) {
                uris.mapNotNull { fr.gendarmerie.fichevehicule.util.ImageUtils.fromUri(context, it) }
            }
            photos.forEach { addPhoto(target, it) }
            busy = false
            if (photos.isEmpty()) toast("Aucune image ajoutée")
        }
    }

    // Galerie (Photo Picker, aucune permission)
    val galleryLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.PickMultipleVisualMedia()
    ) { uris -> processUris(photoTarget, uris) }

    // Appareil photo
    val takePictureLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.TakePicture()
    ) { success ->
        val uri = cameraUri
        if (success && uri != null) processUris(photoTarget, listOf(uri))
    }

    fun launchCamera() {
        val file = File(context.cacheDir, "cam_${System.currentTimeMillis()}.jpg")
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
        cameraUri = uri
        takePictureLauncher.launch(uri)
    }

    val cameraPermLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) launchCamera() else toast("Permission caméra refusée")
    }

    fun requestCamera() {
        val granted = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) ==
            PackageManager.PERMISSION_GRANTED
        if (granted) launchCamera() else cameraPermLauncher.launch(Manifest.permission.CAMERA)
    }

    fun openGallery() {
        galleryLauncher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
    }

    fun generatePdf(then: (File) -> Unit) {
        scope.launch {
            busy = true
            try {
                val file = withContext(Dispatchers.IO) { FichePdfGenerator(context).generate(fiche) }
                busy = false
                then(file)
            } catch (e: Exception) {
                busy = false
                toast("Erreur PDF : ${e.message}")
            }
        }
    }

    if (!ready) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        return
    }

    Column(Modifier.fillMaxSize()) {
        // ---- En-tête bleu nuit ----
        Surface(color = MaterialTheme.colorScheme.primary) {
            Column(Modifier.statusBarsPadding().padding(horizontal = 16.dp, vertical = 10.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("Fiche véhicule", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text("Perception & réintégration", color = Color.White.copy(alpha = 0.75f), fontSize = 12.sp)
                    }
                    IconButton(onClick = { showSettings = true }) {
                        Icon(Icons.Default.Settings, "Réglages", tint = Color.White)
                    }
                }
                SegmentedToggle(
                    leftLabel = "PERCEPTION (sortie)",
                    rightLabel = "RÉINTÉGRATION (retour)",
                    leftSelected = fiche.mouvement == Mouvement.PERCEPTION,
                    accent = MaterialTheme.colorScheme.secondary,
                    onSelectLeft = { vm.setMouvement(Mouvement.PERCEPTION) },
                    onSelectRight = { vm.setMouvement(Mouvement.REINTEGRATION) },
                    modifier = Modifier.padding(top = 10.dp),
                )
            }
        }

        // ---- Contenu défilant ----
        Column(
            Modifier
                .weight(1f)
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // 1. Mouvement
            SectionCard(1, "Mouvement") {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    LabeledTextField("Date", fiche.date, { v -> vm.update { it.copy(date = v) } })
                    LabeledTextField("Lieu", fiche.lieu, { v -> vm.update { it.copy(lieu = v) } })
                    LabeledTextField("Unité / formation", fiche.unite, { v -> vm.update { it.copy(unite = v) } }, singleLine = false, minLines = 2)
                }
            }

            // 2. Identification du véhicule
            SectionCard(2, "Identification du véhicule") {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    LabeledTextField("Marque / modèle", fiche.vehicule.marque, { v -> vm.update { it.copy(vehicule = it.vehicule.copy(marque = v)) } })
                    LabeledTextField("Immatriculation", fiche.vehicule.immat, { v -> vm.update { it.copy(vehicule = it.vehicule.copy(immat = v)) } })
                    LabeledTextField("N° de parc", fiche.vehicule.parc, { v -> vm.update { it.copy(vehicule = it.vehicule.copy(parc = v)) } })
                    LabeledTextField("Catégorie / type", fiche.vehicule.categorie, { v -> vm.update { it.copy(vehicule = it.vehicule.copy(categorie = v)) } })
                    Dropdown("Énergie", fiche.vehicule.energie.ifBlank { "—" }, Defaults.ENERGIES, { v -> vm.update { it.copy(vehicule = it.vehicule.copy(energie = v)) } })
                    LabeledTextField("Kilométrage compteur", fiche.vehicule.km, { v -> vm.update { it.copy(vehicule = it.vehicule.copy(km = v.filter { c -> c.isDigit() })) } }, keyboardType = KeyboardType.Number)
                    Text("Niveau carburant", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    PillSelector(Defaults.NIVEAUX_CARBURANT, fiche.vehicule.carburant, { v -> vm.update { it.copy(vehicule = it.vehicule.copy(carburant = v)) } })
                }
            }

            // 3. État général
            SectionCard(3, "État général") {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Dropdown("Propreté extérieure", fiche.exterieurPropre, Defaults.ETATS_PROPRETE, { v -> vm.update { it.copy(exterieurPropre = v) } })
                    Dropdown("Propreté intérieure", fiche.interieurPropre, Defaults.ETATS_PROPRETE, { v -> vm.update { it.copy(interieurPropre = v) } })
                    Text("État des pneumatiques", fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.primary)
                    TyreGrid(fiche.pneus, { p -> vm.update { it.copy(pneus = p) } })
                }
            }

            // 4. Documents de bord
            SectionCard(4, "Documents de bord") {
                Checklist(fiche.documents, { index, present ->
                    vm.update { f -> f.copy(documents = f.documents.mapIndexed { i, it -> if (i == index) it.copy(present = present) else it }) }
                })
            }

            // 5. Équipements / dotation
            SectionCard(5, "Équipements / dotation") {
                Checklist(fiche.equipements, { index, present ->
                    vm.update { f -> f.copy(equipements = f.equipements.mapIndexed { i, it -> if (i == index) it.copy(present = present) else it }) }
                })
            }

            // 6. Avaries / anomalies
            SectionCard(6, "Avaries / anomalies") {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    LabeledTextField("Avaries, rayures, anomalies constatées", fiche.avaries, { v -> vm.update { it.copy(avaries = v) } }, singleLine = false, minLines = 3)
                    Text("Photos d'avarie / rayure", fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.primary)
                    PhotoGallery(
                        photos = fiche.photosAvaries,
                        onAddCamera = { photoTarget = PhotoTarget.AVARIE; requestCamera() },
                        onAddGallery = { photoTarget = PhotoTarget.AVARIE; openGallery() },
                        onDelete = { index -> vm.update { f -> f.copy(photosAvaries = f.photosAvaries.filterIndexed { i, _ -> i != index }) } },
                        onLegende = { index, leg -> vm.update { f -> f.copy(photosAvaries = f.photosAvaries.mapIndexed { i, p -> if (i == index) p.copy(legende = leg) else p }) } },
                    )
                }
            }

            // 7. Observations
            SectionCard(7, "Observations") {
                LabeledTextField("Observations", fiche.observations, { v -> vm.update { it.copy(observations = v) } }, singleLine = false, minLines = 3)
            }

            // 8. Photos générales
            SectionCard(8, "Photos générales") {
                PhotoGallery(
                    photos = fiche.photosGenerales,
                    onAddCamera = { photoTarget = PhotoTarget.GENERALE; requestCamera() },
                    onAddGallery = { photoTarget = PhotoTarget.GENERALE; openGallery() },
                    onDelete = { index -> vm.update { f -> f.copy(photosGenerales = f.photosGenerales.filterIndexed { i, _ -> i != index }) } },
                    onLegende = { index, leg -> vm.update { f -> f.copy(photosGenerales = f.photosGenerales.mapIndexed { i, p -> if (i == index) p.copy(legende = leg) else p }) } },
                )
            }

            // 9. Constatation contradictoire
            SectionCard(9, "Constatation contradictoire") {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Text("Cédant", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    LabeledTextField("Grade", fiche.cedant.grade, { v -> vm.update { it.copy(cedant = it.cedant.copy(grade = v)) } })
                    LabeledTextField("Nom", fiche.cedant.nom, { v -> vm.update { it.copy(cedant = it.cedant.copy(nom = v)) } })
                    LabeledTextField("Unité", fiche.cedant.unite, { v -> vm.update { it.copy(cedant = it.cedant.copy(unite = v)) } })
                    SignaturePad("Signature du cédant", fiche.cedant.signaturePng, { png -> vm.update { it.copy(cedant = it.cedant.copy(signaturePng = png)) } })

                    Text("Preneur", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    LabeledTextField("Grade", fiche.preneur.grade, { v -> vm.update { it.copy(preneur = it.preneur.copy(grade = v)) } })
                    LabeledTextField("Nom", fiche.preneur.nom, { v -> vm.update { it.copy(preneur = it.preneur.copy(nom = v)) } })
                    LabeledTextField("Unité", fiche.preneur.unite, { v -> vm.update { it.copy(preneur = it.preneur.copy(unite = v)) } })
                    SignaturePad("Signature du preneur", fiche.preneur.signaturePng, { png -> vm.update { it.copy(preneur = it.preneur.copy(signaturePng = png)) } })
                }
            }

            // 10. Destinataires
            SectionCard(10, "Destinataires") {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    LabeledTextField("Adresses mail (séparées par , ; ou retour ligne)", fiche.destinataires, { v -> vm.update { it.copy(destinataires = v) } }, singleLine = false, minLines = 2, keyboardType = KeyboardType.Email)
                    OutlinedButton(
                        onClick = {
                            val emails = ShareUtils.parseEmails(fiche.destinataires).joinToString(", ")
                            val clip = context.getSystemService(android.content.ClipboardManager::class.java)
                            clip.setPrimaryClip(android.content.ClipData.newPlainText("destinataires", emails))
                            toast("Adresses copiées")
                        },
                    ) { Text("Copier les adresses") }
                    LabeledTextField("Objet", fiche.objet, { v -> vm.update { it.copy(objet = v) } })
                }
            }

            Box(Modifier.padding(bottom = 8.dp))
        }

        // ---- Barre d'actions fixe ----
        Surface(tonalElevation = 3.dp, shadowElevation = 8.dp) {
            Row(
                Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                OutlinedButton(onClick = { vm.reset(); toast("Fiche réinitialisée") }) {
                    Icon(Icons.Default.Refresh, null)
                }
                OutlinedButton(
                    onClick = { generatePdf { file -> ShareUtils.openPdf(context, file); toast("PDF généré") } },
                    modifier = Modifier.weight(1f),
                ) {
                    Text("PDF")
                }
                Button(
                    onClick = {
                        generatePdf { file ->
                            ShareUtils.sendMail(
                                context, file, fiche.destinataires, fiche.objet,
                                corps = "Veuillez trouver ci-joint la fiche de ${
                                    if (fiche.mouvement == Mouvement.PERCEPTION) "perception" else "réintégration"
                                } du véhicule ${fiche.vehicule.immat}.",
                            )
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                    modifier = Modifier.weight(1f),
                ) {
                    Icon(Icons.Default.Send, null)
                    Text("  Envoyer")
                }
            }
        }
    }

    if (busy) {
        Box(
            Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center,
        ) {
            Surface(color = Color(0x66000000), modifier = Modifier.fillMaxSize()) {}
            CircularProgressIndicator()
        }
    }

    if (showSettings) {
        SettingsSheet(
            settings = settings,
            onDismiss = { showSettings = false },
            onSave = { vm.saveSettings(it) },
        )
    }
}
