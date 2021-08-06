/*Stylesheet by Will P. Campbell,2021*/
//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

var attrArray = ["FID", "AREA", "PERIMETER", "OVGPW95C_", "OVGPW95C_I",
                "VEG_TYPE","LUC_LEVEL2","FID2"]; //list of attributes
var expressed = attrArray[0]; //initial attribute

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width = 960,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3.geoAlbers()
        .center([0, 44.5])
        .rotate([89, 0, 0])
        .parallels([43, 62])
        .scale(4500)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/vegdata.csv")); // loads csv data
    promises.push(d3.json("data/states.topojson"))
    promises.push(d3.json("data/veg_area.topojson")) // loads map data
    Promise.all(promises).then(callback);

    //callback function    
    function callback(data){

        vegdata_csv = data[0]; states=data[1]; vegdata_topojson = data[2];//define the data
        
        //place graticule on the map
        setGraticule(map, path);

        //translate vegetation topojson to geojson
        //var usaTopojson = topojson.feature(states, states.objects.states),
            vegetationTopojson = topojson.feature(vegdata_topojson, vegdata_topojson.objects.veg_area).features;

        // // add the USA geojson to the map
        // var stateMap = map.append("path")
        // .datum(usaTopojson)
        // .attr("class", "stateMap")
        // .attr("d", path);
        
        //join csv data to GeoJSON enumeration units
        vegetationTopojson = joinData(vegetationTopojson, vegdata_csv);

        //create the color scale
        var colorScale = makeColorScaleNatural(vegdata_csv);

        //add enumeration units to the map
        setEnumerationUnits(vegetationTopojson, map, path, colorScale);

        //add coordinated visualization to the map
        //setChart(vegdata_csv, colorScale);

    };//end of function callback
};// end of function setMap

    
function setGraticule(map, path){
    //create graticule generator
    //...GRATICULE BLOCKS FROM MODULE 8
    var graticule = d3.geoGraticule()
        .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

    //create graticule background
    var gratBackground = map.append("path")
        .datum(graticule.outline()) //bind graticule background
        .attr("class", "gratBackground") //assign class for styling
        .attr("d", path); //project graticule

//create graticule lines
    var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
        .data(graticule.lines()) //bind graticule lines to each element to be created
        .enter() //create an element for each datum
        .append("path") //append each element to the svg as a path element
        .attr("class", "gratLines") //assign class for styling
        .attr("d", path); //project graticule lines
};//end of function setGraticule
   
function joinData(vegetationTopojson,vegdata_csv){
    //...DATA JOIN LOOPS FROM EXAMPLE 1.1
    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<vegdata_csv.length; i++){
        var csvRegion = vegdata_csv[i]; // the current region
        var csvKey = csvRegion.FID2; //the geojson primary key

        //loop through geojson regions to find correct region
        for (var a=0; a<vegetationTopojson.length; a++){

            var geojsonProps = vegetationTopojson[a].properties; //the current vegetation geojson properties
            var geojsonKey = geojsonProps.FID2; //the geojson primary key

            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){
                
                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojon properties
                });
            };
        };
    };

    console.log("This is the converted veg geojson",vegetationTopojson);

    return vegetationTopojson;
}; //end of function joinData

//Example 1.6 Natural Breaks color scale
function makeColorScaleNatural(data){
    var colorClasses = [
        "#FFFFCC",
        "#C2E669",
        "#78C679",
        "#31A354",
        "#006837"
    ];

    //create color scale generator
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    //console.log(domainArray);
    domainArray.shift();

    //assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);
	//console.log(domainArray);

    return colorScale;
};//end of function makeColorScaleNatural


//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};


function setEnumerationUnits(vegetationTopojson, map, path, colorScale){
    //...REGIONS BLOCK FROM MODULE 8
	//add France regions to map
    var wisconsin = map.selectAll(".wisconsin")
        .data(vegetationTopojson)
        .enter()
        .append("path")
        .attr("class",  function(d){
            return "wisconsin " + d.properties.FID2;
        })
        .attr("d",path)
        .style("fill",  function(d){
            return choropleth(d.properties,colorScale)
        });
}; // end of function setEnumerationUnits

//function to create coordinated bar chart
// function setChart(csvData, colorScale){
//     //chart frame dimensions
//     var chartWidth = window.innerWidth * 0.425,
//         chartHeight = 473,
//         leftPadding = 25,
//         rightPadding = 2,
//         topBottomPadding = 5,
//         chartInnerWidth = chartWidth - leftPadding - rightPadding,
//         chartInnerHeight = chartHeight - topBottomPadding * 2,
//         translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//     //create a second svg element to hold the bar chart
//     var chart = d3.select("body")
//         .append("svg")
//         .attr("width", chartWidth)
//         .attr("height", chartHeight)
//         .attr("class", "chart");

//     //create a rectangle for chart background fill
//     var chartBackground = chart.append("rect")
//         .attr("class", "chartBackground")
//         .attr("width", chartInnerWidth)
//         .attr("height", chartInnerHeight)
//         .attr("transform", translate);

//     //create a scale to size bars proportionally to frame
//     var csvmax = d3.max(csvData, function(d) { return parseFloat(d[expressed]); });
//     console.log(csvmax);
//     var yScale = d3.scaleLinear()
//         .range([chartHeight - 10, 0])
//         .domain([0, csvmax + 20]);

//     //set bars for each province
//     var bars = chart.selectAll(".bar")
//         .data(csvData)
//         .enter()
//         .append("rect")
//         .sort(function(a, b){
//             return b[expressed]-a[expressed]
//         })
//         .attr("class", function(d){
//             return "bar " + d.adm1_code;
//         })
//         .attr("width", chartInnerWidth / csvData.length - 1)
//         .attr("x", function(d, i){
//             return i * (chartInnerWidth / csvData.length) + leftPadding;
//         })
//         .attr("height", function(d, i){
//             return chartHeight - 10 - yScale(parseFloat(d[expressed]));
//         })
//         .attr("y", function(d, i){
//             return yScale(parseFloat(d[expressed])) + topBottomPadding;
//         })
//         .style("fill", function(d){
//             return choropleth(d, colorScale);
//         });
//DONT UNCOMMENT THIS
    // //annotate bars with attribute value text
    // var numbers = chart.selectAll(".numbers")
    //     .data(csvData)
    //     .enter()
    //     .append("text")
    //     .sort(function(a, b){
    //         return a[expressed]-b[expressed]
    //     })
    //     .attr("class", function(d){
    //         return "numbers " + d.adm1_code;
    //     })
    //     .attr("text-anchor", "middle")
    //     .attr("x", function(d, i){
    //         var fraction = chartWidth / csvData.length;
    //         return i * fraction + (fraction - 1) / 2;
    //     })
    //     .attr("y", function(d){
    //         return chartHeight - yScale(parseFloat(d[expressed])) + 15;
    //     })
    //     .text(function(d){
    //         return d[expressed];
    //     });

    //create a text element for the chart title
//     var chartTitle = chart.append("text")
//         .attr("x", 40)
//         .attr("y", 40)
//         .attr("class", "chartTitle")
//         .text("Number of Variable " + expressed[3] + " in each region");

//     //create vertical axis generator
//     var yAxis = d3.axisLeft()
//         .scale(yScale);

//     //place axis
//     var axis = chart.append("g")
//         .attr("class", "axis")
//         .attr("transform", translate)
//         .call(yAxis);

//     //create frame for chart border
//     var chartFrame = chart.append("rect")
//         .attr("class", "chartFrame")
//         .attr("width", chartInnerWidth)
//         .attr("height", chartInnerHeight)
//         .attr("transform", translate);

// };













})(); //last line of main.js