$ErrorActionPreference = 'Continue'

Write-Host "SyKaşif Yerel Dijital İkiz Önkoşul Denetimi" -ForegroundColor Cyan
Write-Host "Hedef profil: i3-9100F / 16 GB RAM / Radeon RX 570 / CPU işleme" -ForegroundColor DarkCyan

$os = Get-CimInstance Win32_OperatingSystem
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$gpus = Get-CimInstance Win32_VideoController
$ramGb = [math]::Round($os.TotalVisibleMemorySize / 1MB, 1)
$drive = Get-PSDrive -Name ($PWD.Drive.Name)
$freeGb = [math]::Round($drive.Free / 1GB, 1)

Write-Host "`nDonanım" -ForegroundColor Yellow
Write-Host "  İşlemci : $($cpu.Name)"
Write-Host "  Çekirdek: $($cpu.NumberOfCores) fiziksel / $($cpu.NumberOfLogicalProcessors) mantıksal"
Write-Host "  RAM     : $ramGb GB"
Write-Host "  GPU     : $($gpus.Name -join ', ')"
Write-Host "  Boş disk: $freeGb GB ($($PWD.Drive.Name):)"

if ($ramGb -lt 14) {
  Write-Warning "16 GB profil için kullanılabilir RAM düşük. Aynı anda başka ağır uygulama çalıştırmayın."
}
if ($freeGb -lt 100) {
  Write-Warning "Fotogrametri için en az 100 GB boş disk önerilir."
}
if (($gpus.Name -join ' ') -match 'Radeon') {
  Write-Host "  GPU modu: AMD kart algılandı; NodeODM CUDA kullanmayacak, CPU profili seçildi." -ForegroundColor Yellow
}

Write-Host "`nYazılım" -ForegroundColor Yellow
$wsl = Get-Command wsl.exe -ErrorAction SilentlyContinue
if ($wsl) {
  Write-Host "  WSL: kurulu" -ForegroundColor Green
  wsl.exe --status 2>$null
} else {
  Write-Host "  WSL: bulunamadı" -ForegroundColor Red
  Write-Host "  Yönetici PowerShell: wsl --install"
}

$docker = Get-Command docker.exe -ErrorAction SilentlyContinue
if ($docker) {
  Write-Host "  Docker CLI: kurulu" -ForegroundColor Green
  docker version --format '  Docker Engine: {{.Server.Version}}' 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Docker Desktop kurulu olabilir fakat Engine çalışmıyor. Docker Desktop'ı açın."
  }
} else {
  Write-Host "  Docker: bulunamadı" -ForegroundColor Red
  Write-Host "  Kurulum: winget install -e --id Docker.DockerDesktop"
}

Write-Host "`nÖnerilen güvenli kapasite" -ForegroundColor Yellow
Write-Host "  Hızlı profil : 20-80 fotoğraf, en fazla 25 MB/fotoğraf"
Write-Host "  Kalite profili: 20-50 fotoğraf; işlem süresi belirgin biçimde uzar"
Write-Host "  Eşzamanlı görev: 1"
Write-Host "  LiDAR: küçük/orta kırpılmış veri setleri"

if ($docker) {
  Write-Host "`nBaşlatma:" -ForegroundColor Cyan
  Write-Host "  npm run twin:up"
  Write-Host "  Invoke-RestMethod http://127.0.0.1:3001/info"
}
