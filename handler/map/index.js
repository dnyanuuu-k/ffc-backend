const draw = require("./draw");
const geometry = require("./geometry");
const geojson = require("./world.json");

const bbox = geometry.bbox(geojson);
const bounds = geometry.grow(bbox, 0);
const countryFeatureMap = {};

geojson.features.forEach(feature => {
	if(feature.properties.iso_a2 !== -99){
		countryFeatureMap[feature.properties.iso_a2] = feature;
	}
});


const getHighlited = ({	        
      fillColor = "#0B66C2",
      strokeColor = "#86888A",
      strokeWidth = 0,
      width = 400,
      countries = [],
      mercator = true
}) => {
	const meta = { farge: fillColor };
	
	// if (args.maxbounds) bbox = geometry.limitBounds(bbox, args.maxbounds);
	let targetFeatures = null;
	if(countries.length){
		targetFeatures = [];
		countries.forEach((countryCode) => {
			const country = countryFeatureMap[countryCode];
			if(country){
				targetFeatures.push(country);
			}else{
				console.log("Country with code not found: " + countryCode);
			}			
		});
	}
	const options = {
		bounds,
		strokeColor,
		strokeWidth,
		width,
		targetFeatures,
		mercator
	};
	return draw(geojson, meta, options);
};

// const { width, height } = render;

// const summary = {
//   bbox: options.bounds,
//   image: { width, height },
//   color: meta.farge,
//   strokeColor: options.strokeColor,
//   strokeWidth: args.stroke,
//   crs: geojson.crs && geojson.crs.properties && geojson.crs.properties.name
// };

// fs.writeFileSync(basename + ".json", JSON.stringify(summary));

module.exports = {
	getHighlited
};
