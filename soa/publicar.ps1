# Gera o pacote da API para o IIS do Kato: soa/publish/MoskittoRadar.Api.zip
# Uso (na pasta soa/):  powershell -ExecutionPolicy Bypass -File .\publicar.ps1
$ErrorActionPreference = 'Stop'
$raiz   = $PSScriptRoot
$saida  = Join-Path $raiz 'publish\MoskittoRadar.Api'
$zip    = Join-Path $raiz 'publish\MoskittoRadar.Api.zip'

if (Test-Path $saida) { Remove-Item $saida -Recurse -Force }
if (Test-Path $zip)   { Remove-Item $zip -Force }

# Framework-dependent: o servidor precisa do ASP.NET Core Hosting Bundle (.NET 10).
dotnet publish (Join-Path $raiz 'MoskittoRadar.Api\MoskittoRadar.Api.csproj') -c Release -o $saida
if ($LASTEXITCODE -ne 0) { throw 'dotnet publish falhou.' }

# O banco local de desenvolvimento nunca vai no pacote: no servidor ele é criado na primeira execução.
Remove-Item (Join-Path $saida 'App_Data') -Recurse -Force -ErrorAction SilentlyContinue

Compress-Archive -Path (Join-Path $saida '*') -DestinationPath $zip
Write-Host "Pacote pronto: $zip"
