#!/bin/bash

# Backup erstellen
mkdir -p backup-posts
cp src/content/blog/*.md backup-posts/

# Alle Posts durchgehen und Frontmatter vereinfachen
for file in src/content/blog/*.md; do
    echo "Cleaning: $file"
    
    # Extrahiere Titel aus Dateinamen als Fallback
    filename=$(basename "$file" .md)
    nice_title=$(echo "$filename" | sed 's/^[0-9-]*//g' | sed 's/-/ /g')
    
    # Erstelle sauberes Frontmatter
    awk -v title="$nice_title" '
    BEGIN { 
        in_fm = 0
        fm_count = 0
        found_title = 0
        found_date = 0
        print "---"
    }
    /^---$/ { 
        fm_count++
        if (fm_count == 1) { in_fm = 1; next }
        if (fm_count == 2) { 
            if (!found_title) print "title: \"" title "\""
            if (!found_date) print "pubDate: 2025-01-01"
            print "description: \"Ein Artikel über Führung und Organisationsentwicklung\""
            print "category: \"Führung\""
            print "tags: []"
            print "---"
            in_fm = 0
            next 
        }
    }
    in_fm && /^title:/ { 
        found_title = 1
        # Bereinige den Titel
        gsub(/^ *title: */, "title: ")
        print
        next
    }
    in_fm && /^(date|pubDate):/ { 
        found_date = 1
        gsub(/^ *(date|pubDate): */, "pubDate: ")
        gsub(/"/, "", $2)
        print "pubDate:", $2
        next
    }
    in_fm { next }  # Ignoriere alles andere im Frontmatter
    !in_fm { print }
    ' "$file" > "$file.clean" && mv "$file.clean" "$file"
done

echo "✅ Alle Posts gesäubert!"
