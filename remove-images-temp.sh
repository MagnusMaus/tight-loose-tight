#!/bin/bash

for file in src/content/blog/*.md; do
    echo "Removing images from: $file"
    # Entferne Markdown-Bilder
    sed -i 's/!\[.*\]([^)]*)/[Bild entfernt]/g' "$file"
    # Entferne HTML img tags
    sed -i 's/<img[^>]*>/[Bild entfernt]/g' "$file"
done

echo "Bilder wurden entfernt!"
