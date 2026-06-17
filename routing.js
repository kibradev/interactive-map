(function () {
    var roadNodes = null;
    var adj       = null;
    var nodeIdx   = null;
    var gScore    = null;
    var cameFrom  = null;
    var closed    = null;
    var loading   = false;
    var CELL      = 150;

    function loadGraph() {
        if (roadNodes) return Promise.resolve(true);
        if (loading)   return new Promise(function (res) { setTimeout(function () { res(!!roadNodes); }, 300); });
        loading = true;
        return fetch('road-graph.json')
            .then(function (r) { return r.json(); })
            .then(function (d) {
                roadNodes = d.n;
                var rawAdj = new Array(roadNodes.length);
                for (var i = 0; i < roadNodes.length; i++) rawAdj[i] = [];
                var e = d.e;
                for (var j = 0; j < e.length; j++) {
                    rawAdj[e[j][0]].push(e[j][1]);
                    rawAdj[e[j][1]].push(e[j][0]);
                }
                adj      = rawAdj;
                gScore   = new Float32Array(roadNodes.length);
                cameFrom = new Int32Array(roadNodes.length);
                closed   = new Uint8Array(roadNodes.length);

                nodeIdx = new Map();
                for (var k = 0; k < roadNodes.length; k++) {
                    var cx = Math.floor(roadNodes[k][0] / CELL);
                    var cy = Math.floor(roadNodes[k][1] / CELL);
                    var key = cx + ',' + cy;
                    if (!nodeIdx.has(key)) nodeIdx.set(key, []);
                    nodeIdx.get(key).push(k);
                }
                loading = false;
                return true;
            })
            .catch(function (err) {
                loading = false;
                console.warn('[routing] road-graph.json yüklenemedi:', err);
                return false;
            });
    }

    function nearestNode(x, y) {
        var cx = Math.floor(x / CELL);
        var cy = Math.floor(y / CELL);
        var best = -1, bestD = Infinity;
        for (var dx = -2; dx <= 2; dx++) {
            for (var dy = -2; dy <= 2; dy++) {
                var list = nodeIdx.get((cx + dx) + ',' + (cy + dy));
                if (!list) continue;
                for (var i = 0; i < list.length; i++) {
                    var n  = roadNodes[list[i]];
                    var ddx = n[0] - x, ddy = n[1] - y;
                    var d  = ddx * ddx + ddy * ddy;
                    if (d < bestD) { bestD = d; best = list[i]; }
                }
            }
        }
        return best;
    }

    function edgeDist(a, b) {
        var dx = roadNodes[a][0] - roadNodes[b][0];
        var dy = roadNodes[a][1] - roadNodes[b][1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    // ---- binary min-heap ------------------------------------------------
    function Heap() { this.d = []; }
    Heap.prototype.push = function (cost, node) {
        this.d.push(cost, node);
        var i = (this.d.length >> 1) - 1;
        while (i > 0) {
            var p = ((i - 1) >> 1);
            if (this.d[p * 2] <= this.d[i * 2]) break;
            var tc = this.d[p * 2], tn = this.d[p * 2 + 1];
            this.d[p * 2] = this.d[i * 2]; this.d[p * 2 + 1] = this.d[i * 2 + 1];
            this.d[i * 2] = tc; this.d[i * 2 + 1] = tn;
            i = p;
        }
    };
    Heap.prototype.pop = function () {
        var topC = this.d[0], topN = this.d[1];
        var last = this.d.length - 2;
        this.d[0] = this.d[last]; this.d[1] = this.d[last + 1];
        this.d.length = last;
        var i = 0, n = this.d.length >> 1;
        while (true) {
            var l = 2 * i + 1, r = 2 * i + 2, s = i;
            if (l < n && this.d[l * 2] < this.d[s * 2]) s = l;
            if (r < n && this.d[r * 2] < this.d[s * 2]) s = r;
            if (s === i) break;
            var tc = this.d[s * 2], tn = this.d[s * 2 + 1];
            this.d[s * 2] = this.d[i * 2]; this.d[s * 2 + 1] = this.d[i * 2 + 1];
            this.d[i * 2] = tc; this.d[i * 2 + 1] = tn;
            i = s;
        }
        return { cost: topC, node: topN };
    };
    Heap.prototype.size = function () { return this.d.length >> 1; };
    // ---------------------------------------------------------------------

    function astar(start, goal) {
        if (start === goal) return [start];

        var gx = roadNodes[goal][0], gy = roadNodes[goal][1];
        var h = function (i) {
            var dx = roadNodes[i][0] - gx, dy = roadNodes[i][1] - gy;
            return Math.sqrt(dx * dx + dy * dy);
        };

        gScore.fill(Infinity);
        cameFrom.fill(-1);
        closed.fill(0);
        gScore[start] = 0;

        var open = new Heap();
        open.push(h(start), start);

        while (open.size() > 0) {
            var item    = open.pop();
            var current = item.node;
            if (current === goal) {
                var path = [], cur = goal;
                while (cur !== -1) { path.push(cur); cur = cameFrom[cur]; }
                return path.reverse();
            }
            if (closed[current]) continue;
            closed[current] = 1;
            var nb = adj[current];
            for (var i = 0; i < nb.length; i++) {
                var n = nb[i];
                if (closed[n]) continue;
                var tg = gScore[current] + edgeDist(current, n);
                if (tg < gScore[n]) {
                    gScore[n]   = tg;
                    cameFrom[n] = current;
                    open.push(tg + h(n), n);
                }
            }
        }
        return null;
    }

    function drawRoute(latLngs) {
        clearBlipPreview();
        L.polyline(latLngs, {
            pane: 'routePane', color: '#ffffff',
            weight: 9, opacity: 0.95, lineCap: 'round', lineJoin: 'round',
            interactive: false
        }).addTo(routeLayer);
        L.polyline(latLngs, {
            pane: 'routePane', color: '#0A84FF',
            weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round',
            interactive: false
        }).addTo(routeLayer);
        window.__phoneRouteLines  = routeLayer.getLayers();
        window.__phonePreviewActive = true;
    }

    window.__handleRouteRequest = function (d) {
        var fromX = Number(d.fromX), fromY = Number(d.fromY);
        var toX   = Number(d.toX),   toY   = Number(d.toY);
        if (!Number.isFinite(fromX) || !Number.isFinite(toX)) {
            postToPhone({ source: '0r-phone-map', type: 'routeResult', points: [] });
            return;
        }
        loadGraph().then(function (ok) {
            if (!ok) {
                postToPhone({ source: '0r-phone-map', type: 'routeResult', points: [] });
                return;
            }
            var sn = nearestNode(fromX, fromY);
            var gn = nearestNode(toX, toY);
            if (sn === -1 || gn === -1) {
                postToPhone({ source: '0r-phone-map', type: 'routeResult', points: [] });
                return;
            }
            var path = astar(sn, gn);
            if (!path) {
                postToPhone({ source: '0r-phone-map', type: 'routeResult', points: [] });
                return;
            }
            var points = path.map(function (i) { return { x: roadNodes[i][0], y: roadNodes[i][1] }; });
            var latLngs = points.map(function (p) { return [p.y, p.x]; });
            drawRoute(latLngs);
            fitBlipPreview(fromX, fromY, toX, toY);
            postToPhone({ source: '0r-phone-map', type: 'routeResult', points: points });
        });
    };

    setTimeout(function () { loadGraph(); }, 800);
})();
