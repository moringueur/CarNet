# kotlinx.serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.**
-keepclassmembers class **$$serializer { *; }
-keepclasseswithmembers class fr.gendarmerie.fichevehicule.** {
    *** Companion;
}
-keep,includedescriptorclasses class fr.gendarmerie.fichevehicule.**$$serializer { *; }
-keepclassmembers class fr.gendarmerie.fichevehicule.** {
    kotlinx.serialization.KSerializer serializer(...);
}
