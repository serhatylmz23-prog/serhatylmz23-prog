# SyKaşif Yerel Dijital İkiz İşçisi

Bu profil kullanıcının mevcut donanımına göre hazırlanmıştır:

- Intel Core i3-9100F (4 çekirdek)
- 16 GB RAM
- AMD Radeon RX 570 8 GB
- Windows 10 x64

RX 570, OpenDroneMap'in CUDA hızlandırmasını kullanamaz. Bu nedenle NodeODM tek görevli CPU modunda, 3 CPU ve en fazla 10 GB RAM ile sınırlandırılmıştır.

## 1. Önkoşul kontrolü

PowerShell'i proje kökünde açın:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\infrastructure\local-twin\check-windows.ps1
```

WSL2 yoksa yönetici PowerShell'de:

```powershell
wsl --install
```

Docker Desktop yoksa:

```powershell
winget install -e --id Docker.DockerDesktop
```

Kurulumlardan sonra Windows'u yeniden başlatın ve Docker Desktop'ın WSL2 motorunu etkinleştirin.

## 2. NodeODM'yi başlatma

```powershell
npm run twin:up
npm run twin:logs
```

Sağlık kontrolü:

```powershell
Invoke-RestMethod http://127.0.0.1:3001/info
Invoke-RestMethod http://127.0.0.1:3000/api/twin/health
```

Durdurma:

```powershell
npm run twin:down
```

## 3. Donanım sınırları

- İlk denemede 20-40, en fazla 12-16 MP fotoğraf kullanın.
- Fotoğraflar arasında yaklaşık %70-80 örtüşme olmalıdır.
- Bulanık, farklı pozlanmış ve tekrar eden görüntüleri çıkarın.
- Aynı anda yalnızca bir görev çalıştırın.
- En az 100 GB boş disk bırakın.
- İşlem sırasında tarayıcı dışında ağır programları kapatın.

Bu sistem tek bir fotoğraftan ölçülü 3B model üretmez. Ölçülü fotogrametri için farklı açılardan çekilmiş, örtüşen bir fotoğraf seti gerekir. GPS/GCP yoksa model göreli koordinatlarda oluşur.
