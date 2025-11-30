$env:SUPABASE_URL = 'https://example.supabase.co'
$env:SUPABASE_SERVICE_KEY = 'example-key'
Set-Location -LiteralPath 'E:\backup\Descargas\Mentha'
python -m uvicorn app.main:app --reload --port 8000 --app-dir backend
