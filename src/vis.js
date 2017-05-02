// Define dimensions for visualization
var width  = 600;
var height = 800;
var centered = null;

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


// Adding legend to svgLeft
var legendFullHeight = width;
var legendFullWidth = 50;
var legendMargin = { top: 5, bottom: 20, left: 20, right: 20 };

// Use margins of plot
var legendWidth = legendFullWidth - legendMargin.left - legendMargin.right;
var legendHeight = legendFullHeight - legendMargin.top - legendMargin.bottom;

var legendSvg = d3.select('#mapLeft').append('svg')
    .attr('width', legendFullWidth)
    .attr('height', legendFullHeight)
    .append('g')
    .attr('transform', 'translate(' + legendMargin.left + ',' +
          legendMargin.top + ')');

var ukTopojson = undefined;

// Keep track of demographic data
var demographicData = d3.map();

// Use this table as frequently as possible when performing operations over all datasets.
var demographic_ids = [{ value: "all", name: "Please Select" },
                       { value: "cob", name: "Country of Birth" },
                       { value: "eth", name: "Ethnic Group" },
                       { value: "hpu", name: "Health and Provisions" },
                       { value: "huw", name: "Hours Worked" },
                       { value: "isx", name: "Industry by Sex" },
                       { value: "lva", name: "Living Arrangements" },
                       { value: "mla", name: "Main Language" },
                       { value: "nid", name: "National Identity" },
                       { value: "qus", name: "Qualifications and Students" },
                       { value: "rel", name: "Religion" },
                       { value: "ten", name: "Tenure" },
                       { value: "pop", name: "Resident Population" },
                       { value: "hhc", name: "Household Composition" }];

var brexitData = undefined;

// Create demographic options for left map
d3.selectAll('#demographic').selectAll('option')
    .data(demographic_ids)
    .enter()
    .append('option')
    .attr('value', d => d.value)
    .text(d => d.name);

d3.select('#demographic')
    .on('change', function() {
        updateDemographicView(d3.select(this).node().value);
    });

d3.select('#subcategory')
    .on('change', function() {
        console.log(d3.select(this).node().value);
        updateSubcategoryView(demographicData.get(d3.select('#demographic').node().value),
                              d3.select(this).node().value);
	// Add something involving color scale updating for legend.
	updateLegendScale(/* add some params */);
    });

d3.select('#brexit')
    .on('change', function() {
        updateBrexitView(brexitData, d3.select(this).node().value);
    });


// Queue a sequence of requests for drawing the map
var q = d3.queue();
    q.defer(d3.json, '../data/uk.json')
    .defer(d3.csv, '../data/brexit/EU-referendum-result-data.csv')
    .defer(d3.csv, '../data/demographics/country_of_birth.csv')
    .defer(d3.csv, '../data/demographics/ethnic_group.csv')
    .defer(d3.csv, '../data/demographics/health_and_provision_of_unpaid_care.csv')
    .defer(d3.csv, '../data/demographics/hours_worked.csv')
    .defer(d3.csv, '../data/demographics/industry_by_sex.csv')
    .defer(d3.csv, '../data/demographics/living_arrangements.csv')
    .defer(d3.csv, '../data/demographics/main_language.csv')
    .defer(d3.csv, '../data/demographics/national_identity.csv')
    .defer(d3.csv, '../data/demographics/qualifications_and_students.csv')
    .defer(d3.csv, '../data/demographics/religion.csv')
    .defer(d3.csv, '../data/demographics/tenure.csv')
    .defer(d3.csv, '../data/demographics/usual_resident_population.csv')
    .defer(d3.csv, '../data/demographics/household_composition.csv')
/* Load all demographic csv files
d3.csv('../data/demographics/datafile_names.csv', function(d) {
    for (var datafile of d) {
        console.log(datafile.name)
        q.defer(d3.csv, datafile.name);
    }
});*/

q.await(function(error, uk, brexit) {
    // Once all requests (currently only one) are complete, this function runs
    if (error) {
        console.error(error);
    }
    console.log(uk);
    ukTopojson = uk;
    brexitData = brexit;
    
    // If processes are deferred earlier in queue than csv's, change demographic_starting_id accordingly
    var demographic_starting_id = 3;
    
    /* Put the demographic data into a d3 map in which the key is the HTML
     * option value */
    for (var i = demographic_starting_id; i < arguments.length; i++) {// Start after brexit argument 
        demographicData.set(demographic_ids[i - 2].value, arguments[i]);
    }
    
/*
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
*/
    
    // Draw land (reformatted to generate lads by lad)
    svgLeft.append('g')
	.attr('id', 'lad')
	.selectAll('path')
	.data(topojson.feature(uk, uk.objects.lad).features)
	.enter()
	.append('path')
	.attr('d', path)
	.on('click', lad_clicked);

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

function updateDemographicView(d) {
    // Grab data for selected demographic view
    var datum = demographicData.get(d);

    // Remove previous options
    d3.selectAll('#subcategory').selectAll('option').remove();
    
    // Add subcategory select options
    d3.selectAll('#subcategory').selectAll('option')
        .data(Object.keys(datum[0]))
        .enter()
        .append('option')
        .attr('value', d => d)
        .text(function (d) {
            if (d != 'district' && d != 'total' && d != '%') {
                return d; // Needs a good heuristic for cutting char length
            }
        });


    d3.selectAll('.container').style('left', '' + d3.select('#control-bar')
                                     .node()
                                     .getBoundingClientRect().right + 'px');
}

function updateSubcategoryView(demo, d) {

    var colorScale = d3.scaleLinear().range(['#edf8b1',
                                             '#7fcdbb',
                                             '#2c7fb8']);
    var tempMap = d3.map();
    
    var min = 1;
    var max = 0;
    for (var i of demo) {
        var calc = +i[d] / i['total'];
        tempMap.set(i.district, calc);
        if (calc < min) {
            min = calc;
        }
        if (calc > max) {
            max = calc;
        }
    }

    colorScale.domain([min, max]);
    svgLeft.selectAll('g').remove();
    svgLeft.append('g')
        .attr('class', 'districts')
        .selectAll('path')
        .data(topojson.feature(ukTopojson, ukTopojson.objects.lad).features)
        .enter()
        .append('path')
        .attr('fill', function(d) {
            console.log(tempMap.get(d.properties.LAD13NM));
            return colorScale(tempMap.get(d.properties.LAD13NM));
        })
        .attr('d', path)
    	.on('click', lad_clicked);

    svgLeft.append("path")
        .datum(topojson.mesh(ukTopojson, ukTopojson.objects.lad,
                             function(a, b) { return a !== b; }))
        .attr("class", "lad-boundary")
        .attr("d", path);
}

function updateBrexitView(demo, d) {

    // Make a color scale for remain/stay votes
    var colorScaleVotes = d3.scalePow().exponent(.75)
        .range(['#ef8a62', '#fff', '#67a9cf']);

    var pct = undefined;
    var votes = d3.map();

    for (var row of demo) {
        if (d == 'Leave') {
            pct = parseInt(row.Pct_Leave);
        } else if (d == 'Remain') {
            pct = parseInt(row.Pct_Remain);
        }
        if (pct != 0) {
            console.log(pct);
            console.log(row.Area_Code);
            votes.set(row.Area_Code, (pct - 50)/100);
        }
    }
    
    var minVote = d3.min(votes.values());
    var maxVote = d3.max(votes.values());

    // Compute the maximum and minimum for the legend for remain/stay votes
    var legendMaxVotes = Math.max(Math.abs(minVote), maxVote);
    var legendMinVotes = -legendMaxVotes;

    // Set the domain of the color scale for the votes
    colorScaleVotes.domain([legendMinVotes, 0, legendMaxVotes]);

    // Create a scale for the legend of remain/stay votes
    var legendVoteScale = d3.scaleLinear()
        .domain([0,8])
        .range([legendMinVotes, legendMaxVotes]);

    // Add coloring for districts voting turnout
    svgRight.append('g')
        .attr('class', 'districts')
        .selectAll('path')
        .data(topojson.feature(ukTopojson, ukTopojson.objects.lad).features)
        .enter()
        .append('path')
        .attr('fill', d => colorScaleVotes(votes.get(d.id)))
        .attr('d', path);

    svgRight.append("path")
        .datum(topojson.mesh(ukTopojson, ukTopojson.objects.lad,
                             function(a, b) { return a !== b; }))
        .attr("class", "lad-boundary")
        .attr("d", path);      
}

function updateLegendScale(/* dataset?, scale? */) {
    // Feed this function
    // create color scale
    var temp_bounds = 3;
    var scale = 100; // Likely percentages
    
    var colorScale = d3.scaleLinear()
	.domain(linspace(-temp_bounds, temp_bounds, 100))
	.range(0, 100)

    // Remove previous entries
    legendSvg.selectAll('*').remove();

    // Add gradient
    var gradient = legendSvg.append('defs')
	.append('linearGradient')
	.attr('id', 'gradient')
        .attr('x1', '0%') // left
        .attr('y1', '100%')
        .attr('x2', '0%') // to right
        .attr('y2', '0%')
        .attr('spreadMethod', 'pad');

    // programatically generate the gradient for the legend
    // this creates an array of [pct, colour] pairs as stop
    // values for legend
    var pct = linspace(0, 100, scale.length).map(function(d) {
        return Math.round(d) + '%';
    });

    var colourPct = d3.zip(pct, scale);

    colourPct.forEach(function(d) {
        gradient.append('stop')
            .attr('offset', d[0])
            .attr('stop-color', d[1])
            .attr('stop-opacity', 1);
    });
    
    legendSvg.append('rect')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#gradient)');
    
    // create a scale and axis for the legend
    var legendScale = d3.scaleLinear()
        .domain([-temp_bounds, temp_bounds])
        .range([legendHeight, 0]);
    
    var legendAxis = d3.axisRight(legendScale)
        .tickValues(d3.range(-3, 4))
        .tickFormat(d3.format("d"));
    
    legendSvg.append("g")
        .attr("class", "legend axis")
        .attr("transform", "translate(" + legendWidth + ", 0)")
        .call(legendAxis);
    
}

function linspace(start, end, n) {

    var out = [];

    if (n < 2) {
	return out;
    }
    
    var delta = (end - start) / (n - 1);
    var i = 0;
    while (i < (n - 1)) {
	out.push(start + (i * delta));
	i++;
    }

    out.push(end)
    return out;
}

function lad_clicked(d) { // Handles click and zoom
    var x, y, k;
    
    if (d && centered !== d) {
	var centroid = path.centroid(d);
	x = centroid[0];
	y = centroid[1];
	k = 4;
	centered = d;
    } else {
	x = width / 2;
	y = height / 2;
	k = 1;
	centered = null;
    }
    
    svgLeft.selectAll("path")
	.classed("active", centered && function(d) { return d === centered; });
    
    svgLeft.transition()
	.duration(750)
	.attr("transform", "translate(" + width / 2 + "," + height / 2
	      + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
	.style("stroke-width", 1.5 / k + "px");
}
