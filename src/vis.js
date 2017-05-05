// Define dimensions for visualization
var width  = 600;
var height = 700;
var centered = null;

// Set up a projection for England which is centered and
// scaled appropriately
var projection = d3.geoAlbers()
    .center([1, 55.8])
    .rotate([4.6, 0])
    .parallels([50, 60])
    .scale(1200 * 5)
    .translate([width / 2.75, height / 16]);

var path = d3.geoPath().projection(projection);

// Add an SVG element
var svgLeft = d3.select("#mapLeft").append("svg")
    .attr('id', 'svgLeft')
    .attr("width", width)
    .attr("height", height);

var svgRight = d3.select("#mapRight").append('svg')
    .attr('id', 'svgRight')
    .attr('width', width)
    .attr('height', height);

var ukTopojson = undefined;

// Keep track of demographic data
var demographicData = d3.map();

// Use this table as frequently as possible when performing operations over all datasets.
var demographic_ids = [{ value: "all", name: "Please Select" },
                       { value: "cob", name: "Country of Birth", colorArr: ['#f7fcfd','#e5f5f9','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#005824'] },
                       { value: "eth", name: "Ethnic Group", colorArr: ['#f7fcfd','#e0ecf4','#bfd3e6','#9ebcda','#8c96c6','#8c6bb1','#88419d','#6e016b'] },
                       { value: "hpu", name: "Health and Provisions", colorArr: ['#f7fcf0','#e0f3db','#ccebc5','#a8ddb5','#7bccc4','#4eb3d3','#2b8cbe','#08589e'] },
                       { value: "huw", name: "Hours Worked", colorArr: ['#fff7ec','#fee8c8','#fdd49e','#fdbb84','#fc8d59','#ef6548','#d7301f','#990000']  },
                       { value: "isx", name: "Industry by Sex", colorArr: ['#fff7fb','#ece7f2','#d0d1e6','#a6bddb','#74a9cf','#3690c0','#0570b0','#034e7b'] },
                       { value: "lva", name: "Living Arrangements", colorArr: ['#fff7fb','#ece2f0','#d0d1e6','#a6bddb','#67a9cf','#3690c0','#02818a','#016450'] },
                       { value: "mla", name: "Main Language", colorArr: ['#f7f4f9','#e7e1ef','#d4b9da','#c994c7','#df65b0','#e7298a','#ce1256','#91003f'] },
                       { value: "nid", name: "National Identity", colorArr: ['#fff7f3','#fde0dd','#fcc5c0','#fa9fb5','#f768a1','#dd3497','#ae017e','#7a0177'] },
                       { value: "qus", name: "Qualifications and Students", colorArr: ['#ffffe5','#f7fcb9','#d9f0a3','#addd8e','#78c679','#41ab5d','#238443','#005a32'] },
                       { value: "rel", name: "Religion", colorArr: ['#ffffd9','#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#0c2c84'] },
                       { value: "ten", name: "Tenure", colorArr: ['#ffffe5','#fff7bc','#fee391','#fec44f','#fe9929','#ec7014','#cc4c02','#8c2d04'] },
                       { value: "pop", name: "Resident Population", colorArr: ['#ffffcc','#ffeda0','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#b10026'] },
                       { value: "hhc", name: "Household Composition", colorArr: ['#ffffff','#f0f0f0','#d9d9d9','#bdbdbd','#969696','#737373','#525252','#252525'] }];

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
        updateSubcategoryView(d3.select('#demographic').node().value, // Demographic value update
                              d3.select(this).node().value);
    });

d3.select('#brexit')
    .on('change', function() {
        updateBrexitView(brexitData, d3.select(this).node().value);
    });

d3.select('#showBrexit')
    .on('change', function() {
	if (d3.select('#showBrexit').property('checked')) {
	    d3.select('#mapRight')
		.style('opacity', 1);
	} else {
	    d3.select('#mapRight')
		.style('opacity', 0);
	}
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
	.on('click', LADClicked);

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
    
    // Make array of options to be added.
    var options = ['Please Select'];
    for (option of Object.keys(datum[0])) {
        if (option != 'district' && option != 'total' && option != '%') {
            options.push(option);
        }
    }

    // Add subcategory select options
    d3.selectAll('#subcategory').selectAll('option')
        .data(options)
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

function updateSubcategoryView(demographicOfChoice, subcategoryOfChoice) {

    var tempMap = d3.map();
    var demographicArray = demographicData.get(demographicOfChoice);
    
    var min = 1;
    var max = 0;
    for (var i of demographicArray) {
        var calc = +i[subcategoryOfChoice] / i['total'];
        tempMap.set(i.district, calc);
        if (calc < min) {
            min = calc;
        }
        if (calc > max) {
            max = calc;
        }
    }
    
    var domain = [];
    var range = max - min;
    var step = range / 7;
    for (var i = 0; i < 8; i++) {
        domain.push(min + (step * i));
    }

    var colorScale = d3.scaleLinear()
	.range(demographic_ids.find(d => d.value === demographicOfChoice).colorArr)
	.domain(domain);
    
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
    	.on('click', LADClicked);

    svgLeft.append("path")
        .datum(topojson.mesh(ukTopojson, ukTopojson.objects.lad,
                             function(a, b) { return a !== b; }))
        .attr("class", "lad-boundary")
        .attr("d", path);

    updateLegendScale(min, max, colorScale, subcategoryOfChoice);
}

function updateLegendScale(min, max, colorScale, subcategoryOfChoice) {

    svgLeft.selectAll('defs').remove();
    svgLeft.selectAll('rect').remove();
    svgLeft.selectAll('text').remove();
    svgLeft.selectAll('g.legendWrapper').remove();
    
    // Make gradient
    var gradient = svgLeft.append('defs')
	.append('linearGradient')
	.attr('id', 'gradient')
	.selectAll('stop')
	.data(colorScale.range())
	.enter()
	.append('stop')
	.attr("offset", function(d,i) { return i/(7); })   
	.attr("stop-color", function(d) { return d; });

    var legendWidth = width * 0.6;
    var legendHeight = 10;
    
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
	.text(subcategoryOfChoice);
    
    //Set scale for x-axis
    var xScale = d3.scaleLinear()
	.range([0, legendWidth])
	.domain([min, max]);
    
    //Define x-axis
    var xAxis = d3.axisBottom(xScale)
	.ticks(7, ',.1%');
    
    //Set up X axis
    legendsvg.append("g")
	.attr("class", "axis")  //Assign "axis" class
	.attr("transform", "translate(" + (-legendWidth/2) + "," + (10 + legendHeight) + ")")
	.call(xAxis);
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

function updateLADInformation(district) {
    
}

function LADClicked(district) { // Handles click and zoom
    var x, y, k;
    
    if (district && centered !== district) {
	var centroid = path.centroid(district);
	x = centroid[0];
	y = centroid[1];
	k = 4;
	centered = district;
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

    updateLADInformation(district);
}
