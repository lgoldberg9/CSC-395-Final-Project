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

// Keep track of Political Data & Districts
var votes = d3.map();

// Make a color scale for remain/stay votes
var colorScaleVotes = d3.scalePow().exponent(.75)
    .range(['#ef8a62', '#fff', '#67a9cf']);

// Queue a sequence of requests for drawing the map
d3.queue()
    .defer(d3.json, '../data/uk.json')
    .defer(d3.csv, '../data/EU-referendum-result-data.csv', function(d) {
        var remainPct = parseInt(d.Pct_Remain);


        if (remainPct != 0) {
            votes.set(d.Area_Code, (remainPct - 50)/100);
        }
    })
    .await(function(error, uk) {
        if (error) {
            console.error(error);
        }
        console.log(uk);
        // Once all requests (currently only one) are complete, this function runs
        
        var minVoteRemain = d3.min(votes.values());
        var maxVoteRemain = d3.max(votes.values());

        // Compute the maximum and minimum for the legend for remain/stay votes
        var legendMaxVotes = Math.max(Math.abs(minVoteRemain), maxVoteRemain);
        var legendMinVotes = -legendMaxVotes;

        // Set the domain of the color scale for the votes
        colorScaleVotes.domain([legendMinVotes, 0, legendMaxVotes]);

        // Create a scale for the legend of remain/stay votes
        var legendVoteScale = d3.scaleLinear()
            .domain([0,8])
            .range([legendMinVotes, legendMaxVotes]);

        // Create legend for voting scale
        for(var i = 0; i <= 8; i++) {
            svgRight.append('rect')
                .attr('x', width * .25 + 30 * i)
                .attr('y', height * .75 + 50)
                .attr('width', 25)
                .attr('height', 25)
                .attr('stroke', '#000')
                .attr('stroke-width', '0.5px')
                .attr('fill', colorScaleVotes(legendVoteScale(i)));

            svgRight.append('text')
                .attr('x', width * .25 + 30 * i - 5)
                .attr('y', height * .75 + 90)
                .attr('font-family', 'sans-serif')
                .attr('font-size', '8pt')
                .text(d3.format('+.1%')(legendVoteScale(i)));
        }

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

        // Add coloring for districts voting turnout
        svgRight.append('g')
            .attr('class', 'districts')
            .selectAll('path')
            .data(topojson.feature(uk, uk.objects.lad).features)
            .enter()
            .append('path')
            .attr('fill', d => colorScaleVotes(votes.get(d.id)))
            .attr('d', path);

        svgRight.append("path")
            .datum(topojson.mesh(uk, uk.objects.lad,
                                 function(a, b) { return a !== b; }))
            .attr("class", "lad-boundary")
            .attr("d", path);      

    });
