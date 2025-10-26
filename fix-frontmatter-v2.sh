#!/bin/bash

for file in src/content/blog/*.md; do
    echo "Bearbeite: $file"
    
    # Backup erstellen
    cp "$file" "${file}.backup"
    
    # Temporäre Datei
    temp_file="${file}.tmp"
    
    # Verbesserte Frontmatter-Anpassung
    awk '
    BEGIN { in_fm = 0; fm_count = 0; has_pubDate = 0; has_desc = 0; has_cat = 0 }
    /^---$/ { 
        fm_count++
        if (fm_count == 1) { in_fm = 1; print; next }
        if (fm_count == 2) { 
            # Fehlende Felder hinzufügen
            if (!has_pubDate) print "pubDate: 2025-01-01"
            if (!has_desc) print "description: \"Ein Artikel über Führung und Organisationsentwicklung\""
            if (!has_cat) print "category: \"Führung\""
            in_fm = 0; print; next 
        }
    }
    in_fm && /^title:/ { print; next }
    in_fm && /^date:/ { 
        gsub(/"/, "", $2)
        print "pubDate:", $2
        has_pubDate = 1
        next 
    }
    in_fm && /^pubDate:/ { has_pubDate = 1; print; next }
    in_fm && /^description:/ { has_desc = 1; print; next }
    in_fm && /^category:/ { has_cat = 1; print; next }
    in_fm && /^categories:/ { 
        has_cat = 1
        getline
        if (/^ *-/) {
            gsub(/["-]/, "", $0)
            gsub(/^ +/, "", $0)
            print "category: \"" $0 "\""
        }
        next
    }
    !in_fm { print }
    in_fm && !/^(title|date|pubDate|description|category|categories|tags):/ { print }
    ' "$file" > "$temp_file"
    
    mv "$temp_file" "$file"
done

echo "✅ Alle Dateien wurden angepasst!"
