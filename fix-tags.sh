#!/bin/bash

for file in src/content/blog/*.md; do
    echo "Fixing: $file"
    # Konvertiere mehrzeilige tags zu einzeiliger Array-Notation
    sed -i ':a;N;$!ba;s/tags:\n\( *- "[^"]*"\n\)*\( *- "[^"]*"\)/tags: []/g' "$file"
    
    # Besserer Ansatz mit awk
    awk '
    /^tags:$/ {
        print "tags: []"
        in_tags = 1
        tags = ""
        next
    }
    in_tags && /^ *- / {
        gsub(/^ *- /, "", $0)
        if (tags) tags = tags ", "
        tags = tags $0
        next
    }
    in_tags && !/^ *- / {
        if (tags) {
            # Gehe eine Zeile zurück und ersetze tags: []
            gsub(/tags: \[\]/, "tags: [" tags "]", prev_line)
            print prev_line
        }
        in_tags = 0
    }
    !in_tags { 
        if (prev_line) print prev_line
        prev_line = $0
    }
    END { if (prev_line) print prev_line }
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
done
