package fr.gendarmerie.fichevehicule.model

import kotlinx.serialization.Serializable

@Serializable
enum class Mouvement { PERCEPTION, REINTEGRATION }

@Serializable
data class Item(val label: String, val present: Boolean = true)

@Serializable
data class Pneus(
    val avg: String = "Bon",
    val avd: String = "Bon",
    val arg: String = "Bon",
    val ard: String = "Bon",
    val sec: String = "Bon"
)

@Serializable
data class Personne(
    val grade: String = "",
    val nom: String = "",
    val unite: String = "",
    val signaturePng: String? = null // PNG base64 (data only)
)

@Serializable
data class Photo(
    val jpegBase64: String,
    val w: Int,
    val h: Int,
    val legende: String = ""
)

@Serializable
data class Vehicule(
    val marque: String = "",
    val immat: String = "",
    val parc: String = "",
    val categorie: String = "",
    val energie: String = "",
    val km: String = "",
    val carburant: String = "Plein" // Vide, 1/4, 1/2, 3/4, Plein
)

@Serializable
data class Fiche(
    val mouvement: Mouvement = Mouvement.PERCEPTION,
    val date: String = "",
    val lieu: String = "",
    val unite: String = "",
    val vehicule: Vehicule = Vehicule(),
    val exterieurPropre: String = "Bon",
    val interieurPropre: String = "Bon",
    val pneus: Pneus = Pneus(),
    val documents: List<Item> = Defaults.DOCUMENTS,
    val equipements: List<Item> = Defaults.EQUIPEMENTS,
    val avaries: String = "",
    val observations: String = "",
    val photosGenerales: List<Photo> = emptyList(),
    val photosAvaries: List<Photo> = emptyList(),
    val cedant: Personne = Personne(),
    val preneur: Personne = Personne(),
    val destinataires: String = "",
    val objet: String = ""
)
