package fr.gendarmerie.fichevehicule

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import fr.gendarmerie.fichevehicule.model.Mouvement
import fr.gendarmerie.fichevehicule.ui.FicheViewModel
import fr.gendarmerie.fichevehicule.ui.FormScreen
import fr.gendarmerie.fichevehicule.ui.theme.Acier
import fr.gendarmerie.fichevehicule.ui.theme.FicheVehiculeTheme
import fr.gendarmerie.fichevehicule.ui.theme.Vert

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { FicheApp() }
    }
}

@Composable
private fun FicheApp() {
    val vm: FicheViewModel = viewModel()
    val fiche by vm.fiche.collectAsStateWithLifecycle()
    val accent = if (fiche.mouvement == Mouvement.PERCEPTION) Acier else Vert
    FicheVehiculeTheme(accent = accent) {
        Surface(Modifier.fillMaxSize()) {
            FormScreen(vm)
        }
    }
}
