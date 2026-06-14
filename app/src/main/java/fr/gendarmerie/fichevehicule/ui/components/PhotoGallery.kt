package fr.gendarmerie.fichevehicule.ui.components

import android.graphics.BitmapFactory
import android.util.Base64
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.BasicAlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import fr.gendarmerie.fichevehicule.model.Photo

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PhotoGallery(
    photos: List<Photo>,
    onAddCamera: () -> Unit,
    onAddGallery: () -> Unit,
    onDelete: (index: Int) -> Unit,
    onLegende: (index: Int, legende: String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var showAddDialog by remember { mutableStateOf(false) }

    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        // Grille 3 colonnes
        photos.chunked(3).forEachIndexed { rowIdx, row ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEachIndexed { colIdx, photo ->
                    val index = rowIdx * 3 + colIdx
                    PhotoCell(
                        photo = photo,
                        onDelete = { onDelete(index) },
                        onLegende = { onLegende(index, it) },
                        modifier = Modifier.weight(1f),
                    )
                }
                repeat(3 - row.size) { Box(Modifier.weight(1f)) }
            }
        }
        // Bouton d'ajout en pointillés
        Box(
            Modifier
                .fillMaxWidth()
                .aspectRatio(3f)
                .border(
                    width = 1.5.dp,
                    color = MaterialTheme.colorScheme.secondary,
                    shape = RoundedCornerShape(10.dp),
                )
                .clickable { showAddDialog = true },
            contentAlignment = Alignment.Center,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Add, null, tint = MaterialTheme.colorScheme.secondary)
                Text("  Ajouter une photo", color = MaterialTheme.colorScheme.secondary, fontWeight = FontWeight.Medium)
            }
        }
    }

    if (showAddDialog) {
        BasicAlertDialog(onDismissRequest = { showAddDialog = false }) {
            Surface(shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.surface) {
                Column(Modifier.padding(8.dp)) {
                    Text(
                        "Ajouter une photo",
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(12.dp),
                    )
                    TextButton(onClick = { showAddDialog = false; onAddCamera() }, modifier = Modifier.fillMaxWidth()) {
                        Text("Appareil photo", modifier = Modifier.fillMaxWidth())
                    }
                    TextButton(onClick = { showAddDialog = false; onAddGallery() }, modifier = Modifier.fillMaxWidth()) {
                        Text("Galerie", modifier = Modifier.fillMaxWidth())
                    }
                    TextButton(onClick = { showAddDialog = false }, modifier = Modifier.align(Alignment.End)) {
                        Text("Annuler")
                    }
                }
            }
        }
    }
}

@Composable
private fun PhotoCell(
    photo: Photo,
    onDelete: () -> Unit,
    onLegende: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val imageBitmap = remember(photo.jpegBase64) {
        try {
            val bytes = Base64.decode(photo.jpegBase64, Base64.DEFAULT)
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.asImageBitmap()
        } catch (e: Exception) {
            null
        }
    }
    Column(modifier, verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Box(
            Modifier
                .fillMaxWidth()
                .aspectRatio(1f)
                .clip(RoundedCornerShape(8.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant),
        ) {
            if (imageBitmap != null) {
                Image(
                    bitmap = imageBitmap,
                    contentDescription = photo.legende,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                )
            }
            Box(
                Modifier
                    .align(Alignment.TopEnd)
                    .padding(4.dp)
                    .background(Color(0xAA000000), RoundedCornerShape(50))
                    .clickable { onDelete() }
                    .padding(2.dp),
            ) {
                Icon(Icons.Default.Close, "Supprimer", tint = Color.White, modifier = Modifier.padding(1.dp))
            }
        }
        OutlinedTextField(
            value = photo.legende,
            onValueChange = onLegende,
            placeholder = { Text("Légende", fontSize = 11.sp) },
            singleLine = true,
            textStyle = androidx.compose.ui.text.TextStyle(fontSize = 11.sp),
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
