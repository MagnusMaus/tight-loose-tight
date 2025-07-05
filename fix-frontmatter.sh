#!/bin/bash

for file in src/content/blog/*.md; do
    # Temporäre Datei erstellen
    temp_file="${file}.tmp"
    
    # Frontmatter anpassen
    awk '
    BEGIN { in_fm = 0; fm_end = 0 }
    /^---$/ && !fm_end { 
        if (!in_fm) { in_fm = 1; print; next } 
        else { fm_end = 1; in_fm = 0; print; next }
    }
    in_fm && /^date:/ { 
        # Datum umformatieren
        gsub(/"/, "", $2)
        print "pubDate:", $2
        print "description: \"Ein Artikel über Führung und Organisationsentwicklung\""
        next 
    }
    in_fm && /^categories:/ { 
        getline
        # Erste Kategorie als Hauptkategorie
        gsub(/["-]/, "", $0)
        gsub(/^ +/, "", $0)
        print "category: \"" $0 "\""
        # Rest als Tags sammeln
        tags = ""
        while (getline && /^ *- /) {
            gsub(/["-]/, "", $0)
            gsub(/^ +- /, "", $0)
            if (tags) tags = tags ", "
            tags = tags "\"" $0 "\""
        }
        if (tags) print "tags: [" tags "]"
        if (/^tags:/) next
        else print
        next
    }
    { print }
    ' "$file" > "$temp_file"
    
    # Original ersetzen
    mv "$temp_file" "$file"
done

echo "✅ Alle Dateien wurden angepasst!"
