# Fiche véhicule — application Android native (Gendarmerie)

Application Android **100 % hors-ligne, sans serveur** permettant de créer une
**fiche de perception / réintégration de véhicule**, prendre des photos, faire
signer, générer un **PDF A4** et l'envoyer par mail via le partage Android
(destinataires, objet et pièce jointe pré-remplis).

Portage natif (Kotlin + Jetpack Compose) d'une PWA existante : la logique et le
rendu PDF sont reproduits, le PDF étant dessiné au `Canvas` via
`android.graphics.pdf.PdfDocument` (aucune librairie PDF tierce).

## Stack

- Kotlin, Jetpack Compose + Material 3
- minSdk 26, targetSdk 35, compileSdk 35, Gradle Kotlin DSL, module unique `app`
- `kotlinx.serialization` (JSON) + DataStore Preferences (brouillon + réglages)
- **Aucune permission INTERNET** — l'application ne contacte jamais le réseau
- Interface entièrement en français

## Structure

```
app/src/main/
 ├─ AndroidManifest.xml                (pas d'INTERNET, FileProvider, CAMERA optionnelle)
 ├─ java/fr/gendarmerie/fichevehicule/
 │   ├─ MainActivity.kt
 │   ├─ model/        Fiche.kt, Defaults.kt
 │   ├─ ui/           FormScreen.kt, SettingsSheet.kt, FicheViewModel.kt,
 │   │                components/*.kt, theme/Theme.kt
 │   ├─ pdf/          FichePdfGenerator.kt, PdfDraw.kt, PdfPalette.kt
 │   ├─ data/         Stores.kt (SettingsStore + DraftStore)
 │   └─ util/         ImageUtils.kt, ShareUtils.kt
 └─ res/  (mipmap-anydpi-v26 adaptive icon, xml/file_paths.xml, values fr)
```

## Compiler (APK debug)

> Prérequis : un **SDK Android** installé (composants `platforms;android-35`,
> `build-tools;35.0.0`, `platform-tools`) et la variable `ANDROID_HOME` /
> `ANDROID_SDK_ROOT` pointant dessus, **ou** un fichier `local.properties` à la
> racine contenant `sdk.dir=/chemin/vers/Android/Sdk`.

```bash
./gradlew assembleDebug
```

L'APK est produit dans :

```
app/build/outputs/apk/debug/app-debug.apk
```

### Installer sur un appareil/émulateur

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## APK release signé (plus tard)

1. Créer un keystore (une seule fois) :

   ```bash
   keytool -genkeypair -v -keystore fiche-vehicule.jks \
     -keyalg RSA -keysize 2048 -validity 10000 -alias fiche
   ```

2. Renseigner les identifiants dans `~/.gradle/gradle.properties` :

   ```properties
   FV_STORE_FILE=/chemin/absolu/fiche-vehicule.jks
   FV_STORE_PASSWORD=********
   FV_KEY_ALIAS=fiche
   FV_KEY_PASSWORD=********
   ```

3. Ajouter dans `app/build.gradle.kts` un `signingConfigs { create("release") { ... } }`
   lisant ces propriétés, le rattacher à `buildTypes { release { signingConfig = ... } }`,
   puis :

   ```bash
   ./gradlew assembleRelease
   # -> app/build/outputs/apk/release/app-release.apk
   ```

## Note sur l'environnement de build distant

Cet environnement Claude Code bloque l'accès réseau à `dl.google.com` et
`maven.google.com` (politique d'egress). Or ces hôtes sont **indispensables**
pour télécharger le SDK Android, le plugin Gradle Android (AGP) et les
dépendances AndroidX/Compose. La compilation n'a donc **pas pu être exécutée
ici** : le build échoue précisément à la résolution du plugin
`com.android.application`. La configuration Gradle est par ailleurs valide
(wrapper, `settings.gradle.kts`, `libs.versions.toml`). Sur un poste disposant du
SDK et d'un accès à `maven.google.com`, `./gradlew assembleDebug` produit l'APK.
