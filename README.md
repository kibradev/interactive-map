<<<<<<< HEAD
# GTA V MAP LEAFLET

Leaflet tabanlı GTA V dünya haritası. `salary.0resmon.org/interactive-map` ile aynı kök yapıda deploy edilir.

## Blip PNG’leri

Tüm sprite görselleri **`blips/`** klasörüne koy: `0.png`, `1.png`, `475.png`, … (iframe ile aynı kökten `blips/{id}.png` olarak yüklenir).

FiveM dokümantasyonundan otomatik indirmek için (repo kökünden, çıktı varsayılan `blips/`):

```bash
python scripts/download_fivem_blip_images.py
```

GIF kaynaklı sprite’lar için: `pip install pillow`. Güncelleme: `--skip-existing`. Deneme: `--dry-run`.

İsteğe bağlı: harici CDN için URL’ye `blipIconBase=https%3A%2F%2F...%2F` query parametresi eklenebilir (0r-phone `Config.Map.blipIconsBaseUrl` ile gönderir).

## URL parametreleri

| Parametre | Açıklama |
|-----------|----------|
| `coords` | `x,y,urlEncodedLabel` veya `x,y,label,spriteId` — noktalı virgülle çoklu marker |
| `playerMarkerIndex` | Oyuncu satırının `coords` içindeki indeksi (`0` veya `-1`) |
| `blipIconBase` | İsteğe bağlı; bitiş `/` ile tam HTTPS taban (CDN) |
| `x`, `y`, `text` | `coords` yokken tek nokta gösterimi |

## Map stilleri

`mapStyles/` altında Atlas / Satellite / Grid tile setleri (README’deki mega link veya mevcut deploy’dan kopyala).

## Bağımlılıklar

- Leaflet CDN (index.html içinde)
- `mapStyles/` dizini

## Lisans

MIT
=======

>>>>>>> 718b30dd66330067318982090d8b89989ce25f26
