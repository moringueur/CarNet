package fr.gendarmerie.fichevehicule.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import fr.gendarmerie.fichevehicule.data.DraftStore
import fr.gendarmerie.fichevehicule.data.Settings
import fr.gendarmerie.fichevehicule.data.SettingsStore
import fr.gendarmerie.fichevehicule.model.Defaults
import fr.gendarmerie.fichevehicule.model.Fiche
import fr.gendarmerie.fichevehicule.model.Mouvement
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class FicheViewModel(app: Application) : AndroidViewModel(app) {

    private val settingsStore = SettingsStore(app)
    private val draftStore = DraftStore(app)

    private val _fiche = MutableStateFlow(Defaults.ficheVierge())
    val fiche: StateFlow<Fiche> = _fiche.asStateFlow()

    private val _settings = MutableStateFlow(Settings())
    val settings: StateFlow<Settings> = _settings.asStateFlow()

    private val _ready = MutableStateFlow(false)
    val ready: StateFlow<Boolean> = _ready.asStateFlow()

    private var saveJob: Job? = null

    init {
        viewModelScope.launch {
            val s = settingsStore.load()
            _settings.value = s
            val draft = draftStore.load()
            _fiche.value = draft ?: Defaults.ficheVierge(
                unite = s.uniteDefaut,
                destinataires = s.destinatairesDefaut,
                gradePreneur = s.gradePreneurDefaut,
                nomPreneur = s.nomPreneurDefaut,
            )
            _ready.value = true
        }
    }

    /** Met à jour la fiche et programme une sauvegarde différée (~400 ms). */
    fun update(transform: (Fiche) -> Fiche) {
        _fiche.value = transform(_fiche.value)
        scheduleSave()
    }

    private fun scheduleSave() {
        saveJob?.cancel()
        saveJob = viewModelScope.launch {
            delay(400)
            draftStore.save(_fiche.value)
        }
    }

    fun setMouvement(m: Mouvement) {
        update { f ->
            // bascule l'objet par défaut si l'utilisateur n'a pas personnalisé
            val nouvelObjet = if (f.objet.isBlank() || f.objet == Defaults.objetDefaut(f.mouvement))
                Defaults.objetDefaut(m) else f.objet
            f.copy(mouvement = m, objet = nouvelObjet)
        }
    }

    /** Réinitialise : efface le brouillon et repart des valeurs par défaut. */
    fun reset() {
        viewModelScope.launch {
            draftStore.clear()
            val s = _settings.value
            _fiche.value = Defaults.ficheVierge(
                unite = s.uniteDefaut,
                destinataires = s.destinatairesDefaut,
                gradePreneur = s.gradePreneurDefaut,
                nomPreneur = s.nomPreneurDefaut,
            )
        }
    }

    fun saveSettings(s: Settings) {
        _settings.value = s
        viewModelScope.launch { settingsStore.save(s) }
    }
}
