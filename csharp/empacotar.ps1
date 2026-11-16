# Gera a entrega do C# para o Teams: csharp/entrega/RM559246_csharp.zip + entrega.txt
# Uso (na pasta csharp/):  powershell -ExecutionPolicy Bypass -File .\empacotar.ps1
$ErrorActionPreference = 'Stop'
$raiz   = $PSScriptRoot
$saida  = Join-Path $raiz 'entrega'
$copia  = Join-Path $saida 'MoskittoRadar.Moderacao'
$zip    = Join-Path $saida 'RM559246_csharp.zip'

if (Test-Path $saida) { Remove-Item $saida -Recurse -Force }
New-Item -ItemType Directory -Path $copia | Out-Null

# Copia o projeto sem as pastas geradas pela compilação.
robocopy (Join-Path $raiz 'MoskittoRadar.Moderacao') (Join-Path $copia 'MoskittoRadar.Moderacao') /E /XD bin obj /NFL /NDL /NJH /NJS | Out-Null
foreach ($arquivo in 'MoskittoRadar.Moderacao.slnx', 'README.md', 'CHANGELOG.md', 'entrega.txt') {
    Copy-Item (Join-Path $raiz $arquivo) $copia
}

Compress-Archive -Path (Join-Path $copia '*') -DestinationPath $zip
Remove-Item $copia -Recurse -Force
Copy-Item (Join-Path $raiz 'entrega.txt') $saida
Write-Host "Entrega pronta em $saida"
