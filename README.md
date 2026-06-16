# GTA V MAP LEAFLET

Leaflet tabanlı GTA V dünya haritası. `salary.0resmon.org/interactive-map` ile aynı kök yapıda deploy edilir.

## Oyuncu marker’ı

Oyuncu satırı (`playerMarkerIndex` ile işaretli veya tek nokta modunda) Apple Maps tarzı mavi puck + yön külahı (`#0C79FE`) ile çizilir; Figma: [Apple Maps iOS26 — Pin](https://www.figma.com/design/awhBqnRalWesSpPorqf7FC/Apple-Maps-iOS26--Community-?node-id=1-2214&m=dev).

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
| `coords` | URL’de kısa tutun: 0r-phone yalnızca **oyuncu** satırını gönderir. Dünya blipleri `postMessage` ile gelir (URI limiti). Elle test: `x,y,label` veya `x,y,label,spriteId` — `;` ile çoklu (uzun URL’den kaçının). |
| `playerMarkerIndex` | Oyuncu satırının `coords` içindeki indeksi (`0` veya `-1`) |
| `playerHeading` | İsteğe bağlı; oyuncu yönü derece (0–360, kuzey=0, saat yönü). 0r-phone iframe ile gönderir. |
| `blipIconBase` | İsteğe bağlı; bitiş `/` ile tam HTTPS taban (CDN) |
| `x`, `y`, `text` | `coords` yokken tek nokta gösterimi |

## Sorun giderme (mavi ekran, `<<<<<<<`)

Sayfada üstte `<<<<<<< HEAD` yazıyorsa veya harita hiç yüklenmiyorsa `index.html` içinde **çözülmemiş Git merge** kalmış demektir; bu metinler `<script>`’i kırar, Leaflet çalışmaz.

1. `index.html` içinde `<<<<<<<`, `=======`, `>>>>>>>` satırlarını tamamen silin veya bu repodaki güncel `index.html`’i kullanın.  
2. `git grep '<<<<<<<'` ile repoda kalan marker arayın.  
3. Eski sayfa önbellekte kaldıysa tarayıcıda sert yenileme yapın; 0r-phone iframe URL’sine `_mv` sürüm parametresi eklenir (önbellek kırma).

## 0r-phone entegrasyonu (blips)

Tablet, dünya bliplerini uzun query yerine `postMessage` ile gönderir:

- `data.source === '0r-phone-map'`
- `data.type === 'blips'`
- `data.markers`: `{ x, y, label, sprite? }[]`

## Map stilleri

`mapStyles/` altında varsayılan olarak **Atlas** kullanılır (`styleAtlas/…`). Satellite / Grid klasörleri ileride özel fork için durabilir; arayüzde harita tipi seçici yok.

## Bağımlılıklar

- Leaflet CDN (index.html içinde)
- `mapStyles/` dizini

## Lisans

MIT
