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
        .center([0, 44.5])
        .rotate([89, 0, 0])
        .parallels([43, 62])
        .scale(4500)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

//use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/vegdata.csv"));
promises.push(d3.json("data/veg_area.topojson"))
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
        .attr("d", path); //project graticule

//create graticule lines
    var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
        .data(graticule.lines()) //bind graticule lines to each element to be created
        .enter() //create an element for each datum
        .append("path") //append each element to the svg as a path element
        .attr("class", "gratLines") //assign class for styling
        .attr("d", path); //project graticule lines


    vegdata_csv = data[0];
    vegdata_topojson = data[1];

    console.log("This is the data array",data)//shows data array on console

    //translate vegetation topojson to geojson
    var vegetationTopojson = topojson.feature(vegdata_topojson, vegdata_topojson.objects.veg_area);

    
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


    console.log("This is the converted veg geojson",vegetationTopojson)

    // add the Wisconsin geojson to the map
    var wisconsin = map.append("path")
        .datum(vegetationTopojson)
        .attr("class", "wisconsin")
        .attr("d", path);
}; //end of function callback
};// end of function setMap
