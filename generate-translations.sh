#!/bin/bash

# Create PO files
for locale in en; do
  echo "Creating ${locale} language files"
  mkdir -p locale/${locale}/LC_MESSAGES
  mkdir -p i18n/${locale}
  msginit --input=./locale/templates/LC_MESSAGES/messages.pot \
          --output-file=./locale/${locale}/LC_MESSAGES/messages.po \
          -l ${locale} --no-translator
  echo "You can translate i18n/${locale}/messages.json"
done

# Convert PO files to JSON
./node_modules/i18n-abide/bin/compile-json locale locale

# Make current version of the code happy
./node_modules/i18n-abide/bin/compile-mo.sh locale
