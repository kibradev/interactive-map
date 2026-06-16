const center_x = 117.3;
const center_y = 172.8;
const scale_x = 0.02072;
const scale_y = 0.0205;

CUSTOM_CRS = L.extend({}, L.CRS.Simple, {
    projection: L.Projection.LonLat,
    scale: function(zoom) {
        return Math.pow(2, zoom);
    },
    zoom: function(sc) {
        return Math.log(sc) / 0.6931471805599453;
    },
    distance: function(pos1, pos2) {
        var x_difference = pos2.lng - pos1.lng;
        var y_difference = pos2.lat - pos1.lat;
        return Math.sqrt(x_difference * x_difference + y_difference * y_difference);
    },
    transformation: new L.Transformation(scale_x, center_x, -scale_y, center_y),
    infinite: true
});

var SateliteStyle = L.tileLayer('mapStyles/styleSatelite/{z}/{x}/{y}.jpg', { minZoom: 0, maxZoom: 8, noWrap: true, continuousWorld: false, attribution: 'Online map GTA V', id: 'SateliteStyle map' });
var AtlasStyle = L.tileLayer('mapStyles/styleAtlas/{z}/{x}/{y}.jpg', { minZoom: 0, maxZoom: 5, noWrap: true, continuousWorld: false, attribution: 'Online map GTA V', id: 'styleAtlas map' });
var GridStyle = L.tileLayer('mapStyles/styleGrid/{z}/{x}/{y}.png', { minZoom: 0, maxZoom: 5, noWrap: true, continuousWorld: false, attribution: 'Online map GTA V', id: 'styleGrid map' });

var ExampleGroup = L.layerGroup();
var Icons = { Example: ExampleGroup };

var mymap = L.map('map', {
    crs: CUSTOM_CRS,
    minZoom: 1,
    maxZoom: 5,
    Zoom: 5,
    maxNativeZoom: 5,
    preferCanvas: false,
    layers: [AtlasStyle],
    center: [0, 0],
    zoom: 3
});

L.control.layers({ Satelite: SateliteStyle, Atlas: AtlasStyle, Grid: GridStyle }, Icons).addTo(mymap);

function customIcon(spriteId) {
    var sid = parseInt(spriteId, 10);
    if (!Number.isFinite(sid) || sid < 0) sid = 1;
    return L.icon({
        iconUrl: 'blips/' + sid + '.png',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -12],
        crossOrigin: true
    });
}

var X = 0;
var Y = 0;
L.marker([Y, X], { icon: customIcon(1) }).addTo(Icons.Example).bindPopup('I am here.');
