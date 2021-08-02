/*Stylesheet by Will P. Campbell,2021*/

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
        .center([-89,43])
        .rotate([-2, 0, 0])
        .parallels([43, 62])
        .scale(1000)
        .translate([width / 2, height / 2]);
    
    var path = d3.geoPath()
		.projection(projection);

//use Promise.all to parallelize asynchronous data loading
var promises = [];
promises.push(d3.csv("data/vegdata.csv"));
promises.push(d3.json("data/veg_area_wgs84_simple.topojson"))
promises.push(d3.json("data/states.topojson"))
Promise.all(promises).then(callback);

//callback function    
function callback(data){
    //create graticule generator
var graticule = d3.geoGraticule()
    .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

//create graticule background
var gratBackground = map.append("path")
.datum(graticule.outline()) //bind graticule background
.attr("class", "gratBackground") //assign class for styling
.attr("d", path) //project graticule

//create graticule lines
var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
.data(graticule.lines()) //bind graticule lines to each element to be created
.enter() //create an element for each datum
.append("path") //append each element to the svg as a path element
.attr("class", "gratLines") //assign class for styling
.attr("d", path); //project graticule lines


    vegdata_csv = data[0];
    vegdata_topojson = data[1];
    states_topojson = data[2];

    console.log("This is the data array",data)//shows data array on console

    //translate vegetation topojson to geojson
    var vegetationTopojson = topojson.feature(vegdata_topojson,vegdata_topojson.objects.veg_area_wgs84),
        statesTopojson = topojson.feature(states_topojson,states_topojson.objects.states);

    console.log("This is the converted veg geojson",vegetationTopojson)
    console.log("This is the converted states geojson",statesTopojson)
    // add the USA geojson to the map
    var states = map.append("path")
        .datum(statesTopojson)
        .attr("class","states")
        .attr("d", path);

    // add the Wisconsin geojson to the map
    var wisconsin = map.selectAll(".wisconsin")
        .data(vegetationTopojson)
        .enter()
        .append("path")
        .attr("class", function(d){
            return d.properties.FID2;
         })
         .attr("d",path);
    

    }; //end of function callback
};// end of function setMap


