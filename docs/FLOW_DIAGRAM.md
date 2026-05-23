User opens website
  ↓
User uploads CSV
  ↓
System validates file
  ↓
System shows data preview
  ↓
User clicks Analyze
  ↓
System detects data quality issues
  ↓
System calculates Data Quality Score
  ↓
System generates AI summary
  ↓
User reviews issue list
  ↓
User selects suggested fixes
  ↓
System shows before-after preview
  ↓
User applies fixes (Auto Clean)
  ↓
System saves cleaned dataset in memory (`dataset_store`)
  ↓
System detects remaining Manual Review issues
  ↓
User continues to Manual Review (using `cleaned_dataset_id`)
  ↓
User edits remaining issues manually
  ↓
System saves final dataset
  ↓
User downloads final CSV

System Flow

Frontend
  ↓
Upload API
  ↓
CSV Parser
  ↓
Data Profiler
  ↓
Rule-Based Quality Engine
  ↓
Issue Generator
  ↓
Score Calculator
  ↓
AI Summary Service
  ↓
Dashboard Response
  ↓
Cleaning Engine
  ↓
Download Service

Data Quality Engine Flow

Dataset
  ↓
Check metadata
  ↓
Detect missing values
  ↓
Detect duplicates
  ↓
Detect whitespace issues
  ↓
Detect strange characters
  ↓
Validate email columns
  ↓
Validate phone columns
  ↓
Generate issues
  ↓
Assign severity
  ↓
Calculate score
  ↓
Generate recommendations

