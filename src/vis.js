// Define dimensions for visualization
var width  = 600;
var height = 800;

// Set up a projection for England which is centered and
// scaled appropriately
var projection = d3.geoAlbers()
    .center([2, 55.4])
    .rotate([4.6, 0])
    .parallels([50, 60])
    .scale(1200 * 5)
    .translate([width / 2.75, height / 16]);

var path = d3.geoPath().projection(projection);

// Add an SVG element
var svgLeft = d3.select("#mapLeft").append("svg")
    .attr("width", width)
    .attr("height", height);

var svgRight = d3.select("#mapRight").append('svg')
    .attr('width', width)
    .attr('height', height);

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
        svgLeft.append('path')
            .datum(topojson.feature(uk, uk.objects.lad))
            .attr("class", "land")
            .attr("d", path);

        svgLeft.append("path")
            .datum(topojson.mesh(uk, uk.objects.lad,
                                 function(a, b) { return a !== b; }))
            .attr("class", "lad-boundary")
            .attr("d", path);

        svgRight.append('path')
            .datum(topojson.feature(uk, uk.objects.lad))
            .attr("class", "land")
            .attr("d", path);

        svgRight.append("path")
            .datum(topojson.mesh(uk, uk.objects.lad,
                                 function(a, b) { return a !== b; }))
            .attr("class", "lad-boundary")
            .attr("d", path);      

    });
