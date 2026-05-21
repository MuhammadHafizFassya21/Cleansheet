import pandas as pd
from app.services.quality_engine import analyze_dataframe
from app.services.parser_service import validate_csv_file

# Test analyze_dataframe with a sample dataframe

df = pd.DataFrame({
    'name': ['Budi', 'Budi', 'Rini'],
    'email': ['budi@mail', 'budi@mail', 'rini@example.com'],
    'phone': ['08123456789', '08123456789', '08123x5678']
})
result = analyze_dataframe(df, 'ds_test')
print('quality_score', result.quality_score)
print('status', result.status)
print('issue_summary', result.issue_summary.dict())
print('issues', len(result.issues))

# Test CSV validation uppercase extension
class FakeUploadFile:
    filename = 'TEST.CSV'

validate_csv_file(FakeUploadFile(), 100)
print('validate_csv_file passed for uppercase extension')
