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

var svgStats = d3.select('#lad-statistics').append('svg')
    .attr('id', 'svgStats')
    .attr('width', width)
    .attr('height', height);

var ukTopojson = undefined;

// Keep track of demographic data
var demographicData = d3.map();

// Use this table as frequently as possible when performing operations over all datasets.
var demographic_ids = [{ value: "cob", name: "Country of Birth", colorArr: ['#f7fcfd','#e5f5f9','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#005824'] },
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

// Define tooltip div for hovering
var tooltip = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

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
        demographicData.set(demographic_ids[i - demographic_starting_id].value, arguments[i]);
    }
    
    // Draw land (reformatted to generate lads by lad)
    svgLeft.append('g')
	.attr('id', 'lad')
	.selectAll('path')
	.data(topojson.feature(uk, uk.objects.lad).features)
	.enter()
	.append('path')
	.attr('d', path)
	.on('click', LADClicked)
	.on('mouseover', function(d) {
	    tooltip.style("opacity", .9);		
            tooltip.text(d.properties.LAD13NM)	
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY - 28) + "px")
		.style('font-weight', 'bold')
		.style('font-size', 18 + 'px');
	})
	.on('mouseout', tooltipHide);

    svgLeft.append("path")
        .datum(topojson.mesh(uk, uk.objects.lad,
                             function(a, b) { return a !== b; }))
        .attr("class", "lad-boundary")
        .attr("d", path);

    svgRight.append('path')
        .datum(topojson.feature(uk, uk.objects.lad))
	.attr('class', 'land')
	.attr("d", path);
    
    svgRight.append("path")
        .datum(topojson.mesh(uk, uk.objects.lad,
                             function(a, b) { return a !== b; }))
        .attr("class", "lad-boundary")
        .attr("d", path);

    // Force update for first time running through
    updateDemographicView(d3.select('#demographic').node().value);
    updateSubcategoryView(d3.select('#demographic').node().value,
                          d3.select('#subcategory').node().value);
    updateBrexitView(brexitData, d3.select('#brexit').node().value);
});

function updateDemographicView(d) {
    // Grab data for selected demographic view
    var datum = demographicData.get(d);

    // Remove previous options
    d3.selectAll('#subcategory').selectAll('option').remove();
    
    // Make array of options to be added.
    var options = [];
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
    	.on('click', LADClicked)
	.on('mouseover', function(d) {
	    tooltip.style("opacity", .9);		
            tooltip.text(d.properties.LAD13NM)	
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY - 28) + "px")
		.style('font-weight', 'bold')
		.style('font-size', 18 + 'px');
	})
	.on('mouseout', tooltipHide);


    svgLeft.append("path")
        .datum(topojson.mesh(ukTopojson, ukTopojson.objects.lad,
                             function(a, b) { return a !== b; }))
        .attr("class", "lad-boundary")
        .attr("d", path);

    updateLegendScale(min, max, colorScale, subcategoryOfChoice, svgLeft, 7, 'Left');
}

function updateLegendScale(min, max, colorScale, subcategoryOfChoice, svg, numInRange, name) {

   
    svg.selectAll('defs').remove();
    svg.selectAll('rect').remove();
    svg.selectAll('text').remove();
    svg.selectAll('g.legendWrapper').remove();
    
    // Make gradient
    var gradient = svg.append('defs')
	.append('linearGradient')
	.attr('id', 'gradient' + name)
	.selectAll('stop')
	.data(colorScale.range())
	.enter()
	.append('stop')
	.attr("offset", function(d,i) { return i/(numInRange); })   
	.attr("stop-color", function(d) { return d; });

    var legendWidth = width * 0.6;
    var legendHeight = 10;
    
    //Color Legend container
    var legendsvg = svg.append("g")
	.attr("class", "legendWrapper")
	.attr("transform", "translate(" + (width/2 - 10) + "," + (height * .93) + ")");
    
    //Draw the Rectangle
    legendsvg.append("rect")
	.attr("class", "legendRect")
	.attr("x", -legendWidth/2)
	.attr("y", 10)
    	.attr("width", legendWidth)
	.attr("height", legendHeight)
	.style("fill", 'url(#gradient' + name + ')');
    
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
    var colorScaleVotes = d3.scalePow()
        .exponent(1/3)
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
        .attr('d', path)
	.on('mouseover', function(d) {
	    tooltip.style("opacity", .9);		
            tooltip.text(d.properties.LAD13NM)	
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY - 28) + "px")
		.style('font-weight', 'bold')
		.style('font-size', 18 + 'px');
	})
	.on('mouseout', tooltipHide);


    svgRight.append("path")
        .datum(topojson.mesh(ukTopojson, ukTopojson.objects.lad,
                             function(a, b) { return a !== b; }))
        .attr("class", "lad-boundary")
        .attr("d", path);

    updateLegendScale(legendMinVotes, legendMaxVotes, colorScaleVotes, 'Brexit Votes', svgRight, 2, 'Right');
}

function LADClicked(district) { // Handles click and zoom
    var x, y, k;
    
    if (district && centered !== district) {
	var centroid = path.centroid(district);
	x = centroid[0];
	y = centroid[1];
	k = 4;
	centered = district;
	// Change Brexit Map
	d3.select('#lad-statistics')
	    .style('z-index', 1)
	    .style('opacity', 1);
	d3.select('#mapRight')
	    .style('z-index', 0);
    } else {
	x = width / 2;
	y = height / 2;
	k = 1;
	centered = null;
	// Change Brexit Map
	d3.select('#lad-statistics')
	    .style('z-index', 0)
	    .style('opacity', 0);
	d3.select('#mapRight')
	    .style('z-index', 1);
    }
    
    svgLeft.selectAll("path")
	.classed("active", centered && function(d) { return d === centered; });
    
    svgLeft.transition()
	.duration(750)
	.attr("transform", "translate(" + width / 2 + "," + height / 2
	      + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
	.style("stroke-width", 1.5 / k + "px");

    updateStatsRight(district);
}

function updateStatsRight(district) {

    /*****************************************
     ******* ADD DEMOGRAPHIC BAR CHART *******
     *****************************************/
    d3.select('#svgStats').selectAll('g').remove();
    
    var margin = {top: 50, right: 100, bottom: 100, left: 60};
        statsWidth  = width - margin.left - margin.right,
        statsHeight = height - margin.top - margin.bottom;
    
    var data = demographicData.get(d3.select('#demographic').node().value)
    
    var stats = data.find(d => d.district === district.properties.LAD13NM);

    var keys   = [];
    var values = [];

    for (var key in stats) {
        if (key != 'district' && key != 'total') {
            keys.push(key);
        }
        values.push(+stats[key]);
    }
    values.shift();
    values.shift(); // Drop total
        
    var x = d3.scaleBand().rangeRound([0, statsWidth]).padding(0.1),
        y = d3.scaleLinear().rangeRound([statsHeight, 0]);
    
    var gDemo = svgStats.append("g")
	.attr('class', 'col-8')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var barFill = demographic_ids.find(d => d.value === d3.select('#demographic').node().value).colorArr[4];
    
    x.domain(keys);
    y.domain([0, d3.max(values)]);

    var xAxis = d3.axisBottom(x);
    
    gDemo.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + statsHeight + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(55)")
        .style("text-anchor", "start");

    gDemo.append("text")
        .attr("x", (statsWidth / 2))             
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .style("text-decoration", "underline")
	.text(demographic_ids.find(d => d.value === d3.select('#demographic').node().value).name
              + ' Statistics of ' + district.properties.LAD13NM);
    
    gDemo.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).ticks(10))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("Frequency");
    
    gDemo.selectAll(".bar")
        .data(values)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d, i) { return x(keys[i]); })
        .attr("y", function(d) { return y(d); })
	.style('fill', barFill)
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return statsHeight - y(d); })
	.on('mouseover', tooltipShow)
	.on('mouseout', tooltipHide);

    
    /*****************************************
     ******* ADD BREXIT VOTE BAR CHART *******
     *****************************************/

    var brexitDataForDistrict = brexitData.find(d => d.Area === district.properties.LAD13NM);
    var votingData = [brexitDataForDistrict.Remain, brexitDataForDistrict.Leave];
    var brexitColors = [ '#ef8a62', '#67a9cf' ];

    var yBrexit = d3.scaleLinear().rangeRound([statsHeight, 0])
        .domain([0, brexitDataForDistrict.Valid_Votes]);
    
    var gBrexit = svgStats.append("g");
//	.attr('class', 'col-4');
    
    gBrexit.append("g")
        .attr("class", "axis axis--y")
        .attr("transform", 'translate(' + (statsWidth + 100) + ', 50)')
        .call(d3.axisLeft(yBrexit).ticks(10))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("Frequency");

    gBrexit.selectAll('.bar')
        .data(votingData)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', statsWidth + 110)
        .attr('y', function(d, i) { return i * (statsHeight - yBrexit(votingData[0])) + 50; })
        .style('fill', function(d,i) { return brexitColors[i]; })
        .attr('width', 100)
        .attr('height', function(d,i) { return statsHeight - yBrexit(d); })
        .on('mouseover', tooltipShow)
        .on('mouseout', tooltipHide);
}

function tooltipShow(d) {
    tooltip.style("opacity", .9);		
    tooltip.text(d)	
        .style("left", (d3.event.pageX) + "px")		
        .style("top", (d3.event.pageY - 28) + "px")
	.style('font-weight', 'bold')
	.style('font-size', 18 + 'px');
}

function tooltipHide(d) {
    tooltip.style("opacity", 0);	
}
