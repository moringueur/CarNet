package fr.gendarmerie.fichevehicule.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import fr.gendarmerie.fichevehicule.model.Defaults
import fr.gendarmerie.fichevehicule.model.Pneus

/** Grille des 5 pneus : AVG, AVD, ARG, ARD, Secours. */
@Composable
fun TyreGrid(
    pneus: Pneus,
    onChange: (Pneus) -> Unit,
    modifier: Modifier = Modifier,
) {
    val etats = Defaults.ETATS_PNEUS
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Dropdown("Pneu avant gauche (AVG)", pneus.avg, etats, { onChange(pneus.copy(avg = it)) })
        Dropdown("Pneu avant droit (AVD)", pneus.avd, etats, { onChange(pneus.copy(avd = it)) })
        Dropdown("Pneu arrière gauche (ARG)", pneus.arg, etats, { onChange(pneus.copy(arg = it)) })
        Dropdown("Pneu arrière droit (ARD)", pneus.ard, etats, { onChange(pneus.copy(ard = it)) })
        Dropdown("Roue de secours", pneus.sec, etats, { onChange(pneus.copy(sec = it)) })
    }
}
