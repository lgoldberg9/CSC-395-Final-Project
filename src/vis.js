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
    .defer(d3.csv, '../data/demographics/health_and_provision_of_unpaid_care.csv')
    .defer(d3.csv, '../data/demographics/ethnic_group.csv')
    .defer(d3.csv, '../data/demographics/main_language.csv')
    .defer(d3.csv, '../data/demographics/hours_worked.csv')
    .defer(d3.csv, '../data/demographics/household_composition.csv')
    .defer(d3.csv, '../data/demographics/industry_by_sex.csv')
    .defer(d3.csv, '../data/demographics/living_arrangements.csv')
    .defer(d3.csv, '../data/demographics/national_identity.csv')
    .defer(d3.csv, '../data/demographics/qualifications_and_students.csv')
    .defer(d3.csv, '../data/demographics/religion.csv')
    .defer(d3.csv, '../data/demographics/tenure.csv')
    .defer(d3.csv, '../data/demographics/usual_resident_population.csv')
/* Load all demographic csv files
d3.csv('../data/demographics/datafile_names.csv', function(d) {
    for (var datafile of d) {
        console.log(datafile.name)
        q.defer(d3.csv, datafile.name);
    }
});*/

q.await(function(error, uk, brexit, cob, hpu, eth, mla, huw, hhc,
                 isx, lva, nid, qus, rel, ten, pop) {
    // Once all requests (currently only one) are complete, this function runs
    if (error) {
        console.error(error);
    }
    console.log(uk);

    ukTopojson = uk;

    brexitData = brexit;
    
    /* Put the demographic data into a d3 map in which the key is the HTML
     * option value */
    /*for (var i = 3; i < arguments.length; i++) {// Start after brexit argument
        demographicData.set(demographic_ids.value, arguments[i]);
    }*/
    demographicData.set('cob', cob);
    demographicData.set('hpu', hpu);
    demographicData.set('eth', eth);
    demographicData.set('mla', mla);
    demographicData.set('huw', huw);
    demographicData.set('hhc', hhc);
    demographicData.set('isx', isx);
    demographicData.set('lva', lva);
    demographicData.set('nid', nid);
    demographicData.set('qus', qus);
    demographicData.set('rel', rel);
    demographicData.set('ten', ten);
    demographicData.set('pop', pop);
    
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
    
    // Draw land (reformatted to generate lad by lad)
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

    var colorScale = d3.scaleLinear().range(['#e5f5f9',
                                             //'#99d8c9',
                                             '#2ca25f']);
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
