package fr.gendarmerie.fichevehicule.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import fr.gendarmerie.fichevehicule.data.Settings
import fr.gendarmerie.fichevehicule.ui.components.LabeledTextField

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsSheet(
    settings: Settings,
    onDismiss: () -> Unit,
    onSave: (Settings) -> Unit,
) {
    var unite by remember { mutableStateOf(settings.uniteDefaut) }
    var destinataires by remember { mutableStateOf(settings.destinatairesDefaut) }
    var gradePreneur by remember { mutableStateOf(settings.gradePreneurDefaut) }
    var nomPreneur by remember { mutableStateOf(settings.nomPreneurDefaut) }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(20.dp)
                .navigationBarsPadding(),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text("Réglages", fontWeight = FontWeight.Bold, fontSize = 20.sp)
            Text(
                "Ces valeurs pré-remplissent chaque nouvelle fiche.",
                fontSize = 13.sp,
            )
            LabeledTextField("Unité / formation par défaut", unite, { unite = it }, singleLine = false, minLines = 2)
            LabeledTextField("Destinataires par défaut", destinataires, { destinataires = it }, singleLine = false, minLines = 2)
            LabeledTextField("Grade du preneur par défaut", gradePreneur, { gradePreneur = it })
            LabeledTextField("Nom du preneur par défaut", nomPreneur, { nomPreneur = it })
            Button(
                onClick = {
                    onSave(
                        Settings(
                            uniteDefaut = unite,
                            destinatairesDefaut = destinataires,
                            gradePreneurDefaut = gradePreneur,
                            nomPreneurDefaut = nomPreneur,
                        )
                    )
                    onDismiss()
                },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Enregistrer")
            }
        }
    }
}
