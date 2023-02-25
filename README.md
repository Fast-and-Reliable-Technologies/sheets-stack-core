# Sheets Stack - CORE

JS wrapper to simplify interactions with Google Sheets. It provides three
modules for different use cases.

## RPC - Remote Procedural Call

This module allows you to interact with sheets at a `cell` level.

## Lists DB

This module treats each column in a spreadsheet as a list. The first row is
the list title and each subsequent cell is an entry.

### Use Cases

- Flash cards
- Sight words

## Basic DB

This module treats each column as a DB column with the first row being the
header. Each subsequent row represents a database entry. While this module
provides advanced pagination, sorting, and querying it runs in memory and
is therefore more scalable for smaller datasets.
