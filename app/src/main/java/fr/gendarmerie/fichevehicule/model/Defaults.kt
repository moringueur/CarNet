package fr.gendarmerie.fichevehicule.model

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** Constantes et valeurs par défaut de l'application. */
object Defaults {

    val DOCUMENTS: List<Item> = listOf(
        Item("Certificat d'immatriculation"),
        Item("Attestation d'assurance"),
        Item("Carnet de bord / d'entretien"),
        Item("Constat amiable"),
        Item("Carte carburant"),
        Item("Ordre de mission / autorisation"),
    )

    val EQUIPEMENTS: List<Item> = listOf(
        Item("Roue de secours / kit anti-crevaison"),
        Item("Cric + manivelle / clé"),
        Item("Gilet haute visibilité"),
        Item("Triangle de présignalisation"),
        Item("Extincteur"),
        Item("Trousse de premiers secours"),
        Item("Lampe / projecteur"),
        Item("Gyrophare / rampe lumineuse"),
        Item("Moyens transmissions (radio)"),
        Item("Câbles de démarrage"),
        Item("Dispositifs neige (chaînes)"),
        Item("Antivol"),
    )

    val ETATS_PNEUS = listOf("Bon", "Usé", "À remplacer")
    val ETATS_PROPRETE = listOf("Bon", "Moyen", "Mauvais")
    val ENERGIES = listOf("Essence", "Diesel", "Hybride", "Électrique", "GPL", "GNV")
    val NIVEAUX_CARBURANT = listOf("Vide", "1/4", "1/2", "3/4", "Plein")

    const val UNITE_DEFAUT = "COMGEND Guadeloupe — Compagnie du Moule\nSection Logistique"

    fun objetDefaut(mouvement: Mouvement): String = when (mouvement) {
        Mouvement.PERCEPTION -> "Fiche perception véhicule"
        Mouvement.REINTEGRATION -> "Fiche réintégration véhicule"
    }

    fun aujourdhui(): String =
        SimpleDateFormat("dd/MM/yyyy", Locale.FRANCE).format(Date())

    /** Construit une fiche neuve pré-remplie à partir des réglages. */
    fun ficheVierge(
        unite: String = UNITE_DEFAUT,
        destinataires: String = "",
        gradePreneur: String = "",
        nomPreneur: String = "",
        mouvement: Mouvement = Mouvement.PERCEPTION,
    ): Fiche = Fiche(
        mouvement = mouvement,
        date = aujourdhui(),
        unite = unite,
        documents = DOCUMENTS,
        equipements = EQUIPEMENTS,
        destinataires = destinataires,
        objet = objetDefaut(mouvement),
        preneur = Personne(grade = gradePreneur, nom = nomPreneur, unite = unite),
        cedant = Personne(unite = unite),
    )
}
