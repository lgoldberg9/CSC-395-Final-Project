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
        updateSubcategoryView(demographicData.get(d3.select('#demographic').node().value),
                              d3.select(this).node().value);
	// Add something involving color scale updating for legend.
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
   /* var colorScale = d3.scaleLinear().range(['#edf8b1',
                                             '#7fcdbb',
                                             '#2c7fb8']); */
    var colorScale = d3.scaleLinear().range(['#7f3b08', '#f7f7f7', '#2d004b']);
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
    svgLeft.selectAll('path.lad-boundary').remove();
    svgLeft.append('g')
        .attr('class', 'districts')
        .selectAll('path')
        .data(topojson.feature(ukTopojson, ukTopojson.objects.lad).features)
        .enter()
        .append('path')
        .attr('fill', function(d) {
            return colorScale(tempMap.get(d.properties.LAD13NM));
        })
        .attr('d', path)
    	.on('click', lad_clicked);

    svgLeft.append("path")
        .datum(topojson.mesh(ukTopojson, ukTopojson.objects.lad,
                             function(a, b) { return a !== b; }))
        .attr("class", "lad-boundary")
        .attr("d", path);

    console.log(min);
    console.log(max);
    updateLegendScale(min, max);
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

function updateLegendScale(min, max) {

    svgLeft.selectAll('defs').remove();
    svgLeft.selectAll('rect').remove();
    svgLeft.selectAll('text').remove();
    svgLeft.selectAll('g.legendWrapper').remove();
    
    var colorScale = d3.scaleLinear()
        .range(['#7f3b08', '#f7f7f7', '#2d004b'])
        .domain(linspace(min, max, 3));

    console.log("Test");

    // Make gradient
    var gradient = svgLeft.append('defs')
	.append('linearGradient')
	.attr('id', 'gradient')
        .attr('x1', '0%') // left
        .attr('y1', '0%')
        .attr('x2', '100%') // right
        .attr('y2', '0%')
        .attr('spreadMethod', 'pad');
    /*	.data(colorScale.range())
	.enter()
	.append('stop')
	.attr("offset", function(d,i) { return i/(2); })   
	.attr("stop-color", function(d) { return d; }); */

    var pct = linspace(0, 100, 3).map(function(d) {
        return Math.round(d) + '%';
    });

    var colorPct = d3.zip(pct, ['#7f3b08', '#f7f7f7', '#2d004b']);

    colorPct.forEach(function(d) {
        gradient.append('stop')
            .attr('offset', d[0])
            .attr('stop-color', d[1])
            .attr('stop-opacity', 1)
    });


    var legendWidth = width * 0.6,
	legendHeight = 10;
    
    //Color Legend container
    var legendsvg = svgLeft.append("g")
	.attr("class", "legendWrapper")
	.attr("transform", "translate(" + (width/2 - 10) + "," + (height * .75) + ")");
    
    //Draw the Rectangle
    legendsvg.append("rect")
	.attr("class", "legendRect")
	.attr("x", -legendWidth/2)
	.attr("y", 10)
    	.attr("width", legendWidth)
	.attr("height", legendHeight)
	.style("fill", 'url(#gradient)');
    
    //Append title
    legendsvg.append("text")
	.attr("class", "legendTitle")
	.attr("x", 0)
	.attr("y", -2)
	.text("Store Competition Index");
    
    //Set scale for x-axis
    var xScale = d3.scaleLinear()
	.range([0, legendWidth])
	.domain([min, max]);
    
    //Define x-axis
    var xAxis = d3.axisBottom(xScale)
	.ticks(5)  //Set rough # of ticks
    
    //Set up X axis
    legendsvg.append("g")
	.attr("class", "axis")  //Assign "axis" class
	.attr("transform", "translate(" + (-legendWidth/2) + "," + (10 + legendHeight) + ")")
	.call(xAxis);
}

function linspace(start, end, n) {
    var out = [];
    var delta = (end - start) / (n - 1);

    var i = 0;
    while(i < (n - 1)) {
        out.push(start + (i * delta));
        i++;
    }

    out.push(end);
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
