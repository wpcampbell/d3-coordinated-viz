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
        .center([0, 46.2])
        .rotate([-2, 0, 0])
        .parallels([43, 62])
        .scale(2500)
        .translate([width / 2, height / 2]);
    
    var path = d3.geoPath()
		.projection(projection);

//use Promise.all to parallelize asynchronous data loading
var promises = [];
promises.push(d3.csv("data/vegdata.csv"));
promises.push(d3.json("data/veg_area_wgs84_simple.topojson"))
Promise.all(promises).then(callback);

//callback function    
function callback(data){
    vegdata_csv = data[0];
    vegdata_topojson = data[1]
    console.log("This is the data array",data)//shows data array on console

    //translate vegetation topojson to geojson
    var vegetationTopojson = topojson.feature(vegdata_topojson,vegdata_topojson.objects.veg_area_wgs84);
    console.log("This is the converted geojson",vegetationTopojson)

}; //end of function callback

};// end of function setMap


