package fr.gendarmerie.fichevehicule.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import fr.gendarmerie.fichevehicule.model.Item

@Composable
fun Checklist(
    items: List<Item>,
    onToggle: (index: Int, present: Boolean) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier) {
        items.forEachIndexed { index, item ->
            Row(
                Modifier
                    .fillMaxWidth()
                    .clickable { onToggle(index, !item.present) }
                    .padding(vertical = 2.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Checkbox(
                    checked = item.present,
                    onCheckedChange = { onToggle(index, it) },
                )
                Text(
                    text = item.label,
                    color = if (item.present) MaterialTheme.colorScheme.onSurface
                    else MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}
