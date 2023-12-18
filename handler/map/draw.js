const geometry = require("./geometry");
const { createCanvas } = require("canvas");
const tinycolor = require("tinycolor2");

function render(geojson, meta, options = {}) {
  const bounds = options.bounds;
  const width = parseInt(options.width) || 512;
  const height = options.mercator ? width * 0.7265625 : geometry.calculateHeightToMaintainAspect(width, bounds);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const scaling = {
    x: { offset: -bounds.left, scale: width / (bounds.right - bounds.left) },
    y: { offset: bounds.top, scale: height / (bounds.top - bounds.bottom) }
  };  
  ctx.lineWidth = options.strokeWidth;
  ctx.antialias = options.antialias || "default";
  ctx.globalCompositeOperation = "multiply";
  ctx.quality = "nearest";
  (options.targetFeatures || geojson.features).forEach(feature => {
    ctx.fillStyle = lookupColor(
      meta,
      feature.properties,
      options.colorProperty
    );
    ctx.strokeStyle =
      options.strokeColor ||
      tinycolor(ctx.fillStyle)
        .darken(10)
        .toString();
    drawGeometries(ctx, feature, scaling, width, options.mercator);
  });
  return new Promise((resolve, reject) => {
    canvas.toBuffer((err, buf) => {
      if (err){
         reject(err);
         return;
      }
      resolve(buf);
    });
  });
}

function drawGeometries(ctx, feature, scaling, width, mercator) {
  feature.geometry &&
    feature.geometry.coordinates.forEach(coordinates =>
      drawGeometry(ctx, coordinates, scaling, width, mercator)
    );
}

function latLngToMercator(lat, lng, width) {
  const x = (lng + 180) * (width / 360);
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    width;

  return { x, y };
}

function drawGeometry(ctx, coordinates, scaling, width, mercator) {
  if (Array.isArray(coordinates[0])) {
    coordinates.forEach(coord => {
      drawGeometry(ctx, coord, scaling, width, mercator);
      return;
    });
  }
  ctx.beginPath();
  coordinates.forEach(coordIn => {
    if(mercator){
      const { x, y } = latLngToMercator(coordIn[1], coordIn[0], width);
      ctx.lineTo(x, y);
    }else{
      const x = (coordIn[0] + scaling.x.offset) * scaling.x.scale;
      const y = (scaling.y.offset - coordIn[1]) * scaling.y.scale;
      ctx.lineTo(x, y);
    }
  });
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
}

function lookupColor(meta, properties, colorProperty) {
  if (!properties) return meta.farge;
  if (!meta.barn) return meta.farge;
  let key = properties[colorProperty] || properties.code; //HACK
  if (!key) return meta.farge;
  key = key.replace("LA-", "-");
  key = key.replace("NA-", "-");
  for (var barn of meta.barn) {
    if (barn[colorProperty].indexOf(key) >= 0) return barn.farge;
  }
  return meta.farge;
}

module.exports = render;
