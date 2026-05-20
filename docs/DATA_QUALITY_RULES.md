# Data Quality Rules

## Rule Categories

### 1. Duplicate Detection
Detect:
- Full row duplicates
- Duplicate values in key columns such as email or phone

Severity:
- Critical if duplicate appears in identifier columns
- Warning if full row duplicate

### 2. Missing Value Detection
Detect:
- Empty cells
- NULL
- N/A
- -
- unknown
- none

Severity:
- Critical if missing value appears in key column
- Warning for normal column
- Info for optional column

### 3. Whitespace Detection
Detect:
- Leading spaces
- Trailing spaces
- Multiple spaces
- Tabs
- Newlines inside cells

Severity:
- Warning

### 4. Strange Character Detection
Detect:
- Replacement character �
- Emojis
- Control characters
- Excessive symbols
- Non-printable characters

Severity:
- Warning or Critical depending on column type

### 5. Email Validation
Valid format:
local-part@domain.extension

Severity:
- Critical

### 6. Indonesian Phone Validation
Valid examples:
- 08123456789
- +628123456789
- 628123456789

Normalized format:
628123456789

Severity:
- Critical