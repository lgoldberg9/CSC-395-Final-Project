// Define dimensions for visualization
var width  = 960;
var height = 500;

// Set up a projection for England which is centered and
// scaled appropriately
var projection = d3.geoAlbers()
//    .center([0, 55.4])
    .rotate([4.4, 0])
    .parallels([50, 60])
    .scale(1200 * 5);
//    .translate([width / 2, height / 2]);

var path = d3.geoPath().projection(projection);

// Add an SVG element
var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

// Queue a sequence of requests for drawing the map
d3.queue()
    .defer(d3.json, '../data/uk.json')
    .await(function(error, uk) {
        if (error) {
            console.error(error);
        }
        console.log(uk);
        // Once all requests (currently only one) are complete, this function runs

        // Draw land
        svg.append('path')
            .datum(topojson.feature(uk, uk.objects.wards))
            .attr("class", "feature")
            .attr("d", path);

        svg.append("path")
            .datum(topojson.mesh(uk, uk.objects.wards,
                                 function(a, b) { return a !== b; }))
            .attr("class", "mesh")
            .attr("d", path);      
    });
