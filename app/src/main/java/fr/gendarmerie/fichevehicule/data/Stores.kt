package fr.gendarmerie.fichevehicule.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import fr.gendarmerie.fichevehicule.model.Defaults
import fr.gendarmerie.fichevehicule.model.Fiche
import kotlinx.coroutines.flow.first
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

private val Context.dataStore by preferencesDataStore(name = "fiche_vehicule")

val AppJson = Json {
    ignoreUnknownKeys = true
    encodeDefaults = true
}

/** Réglages persistants, pré-remplis à chaque nouvelle fiche. */
@Serializable
data class Settings(
    val uniteDefaut: String = Defaults.UNITE_DEFAUT,
    val destinatairesDefaut: String = "",
    val gradePreneurDefaut: String = "",
    val nomPreneurDefaut: String = "",
)

class SettingsStore(private val context: Context) {
    private val KEY = stringPreferencesKey("settings_json")

    suspend fun load(): Settings {
        val prefs = context.dataStore.data.first()
        val json = prefs[KEY] ?: return Settings()
        return try {
            AppJson.decodeFromString<Settings>(json)
        } catch (e: Exception) {
            Settings()
        }
    }

    suspend fun save(settings: Settings) {
        context.dataStore.edit { it[KEY] = AppJson.encodeToString(settings) }
    }
}

/** Brouillon : sauvegarde/restauration automatique de la fiche en JSON. */
class DraftStore(private val context: Context) {
    private val KEY = stringPreferencesKey("draft_json")

    suspend fun load(): Fiche? {
        val prefs = context.dataStore.data.first()
        val json = prefs[KEY] ?: return null
        return try {
            AppJson.decodeFromString<Fiche>(json)
        } catch (e: Exception) {
            null
        }
    }

    suspend fun save(fiche: Fiche) {
        context.dataStore.edit { it[KEY] = AppJson.encodeToString(fiche) }
    }

    suspend fun clear() {
        context.dataStore.edit { it.remove(KEY) }
    }
}
