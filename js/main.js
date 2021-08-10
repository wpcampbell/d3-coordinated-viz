/*Stylesheet by Will P. Campbell,2021*/
//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

    var attrArray = ["fid", "area", "perimeter", "ovgpw95c_", "ovgpw95c_i",
                    "veg_type","luc_level2"]; //list of attributes
    var expressed = attrArray[0]; //initial attribute
    
    //chart frame dimensions
    var chartWidth = window.innerWidth *0.425,
            chartHeight = 473,
            leftPadding = 25,
            rightPadding = 2,
            topBottomPadding = 2,
            chartInnerWidth = chartWidth - leftPadding - rightPadding,
            chartInnerHeight = chartHeight - topBottomPadding * 2,
            translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a scale to size bars proportionally to frame
    var yScale = d3.scaleLinear()
    .range([chartHeight ,0])
    .domain([0, 600]);

    //begin script when window loads
    window.onload = setMap();
    
    //set up choropleth map
    function setMap(){
    
        //map frame dimensions
        var width = window.innerWidth *0.5,
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
            .rotate([90, 0])
            .parallels([43, 62])
            .scale(5000)
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
            var usaTopojson = topojson.feature(states, states.objects.states),
                vegetationTopojson = topojson.feature(vegdata_topojson, vegdata_topojson.objects.veg_area).features;
    
            // // add the USA geojson to the map
            // var stateMap = map.append("path")
            // .datum(usaTopojson)
            // .attr("class", "stateMap")
            // .attr("d", path);
            
            //join csv data to GeoJSON enumeration units
            vegetationTopojson = joinData(vegetationTopojson, vegdata_csv);
            console.log(vegetationTopojson)
            //create the color scale
            var colorScale = makeColorScale(vegdata_csv);
    
            //add enumeration units to the map
            setEnumerationUnits(vegetationTopojson, map, path, colorScale);
    
            //add coordinated visualization to the map
            setChart(vegdata_csv, colorScale);
    
            createDropdown(vegdata_csv)
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
            var csvKey = csvRegion.fid2; //the geojson primary key
    
            //loop through geojson regions to find correct region
            for (var a=0; a<vegetationTopojson.length; a++){
    
                var geojsonProps = vegetationTopojson[a].properties; //the current vegetation geojson properties
                var geojsonKey = geojsonProps.fid2; //the geojson primary key
    
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
    function makeColorScale(data){
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
    domainArray.shift();

    //assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);
        return colorScale;
    };//end of function makeColorScale
    
    
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
                return "wisconsin " + d.properties.fid2;
            })
            .attr("d",path)
            .style("fill",  function(d){
                return choropleth(d.properties,colorScale);
            })
            .on("mouseover",function(d){
                highlight(this);
            })
            .on("mouseout", function(d){
                dehighlight(this);
            })
            .on("mousemove", moveLabel);
            //add style descriptor 
            var desc = wisconsin.append("desc")
            .text('{"stroke: "#000","stroke-width: "0.5px"}');
            
    }; // end of function setEnumerationUnits
    
    //function to create coordinated bar chart
    function setChart(vegdata_csv, colorScale){

        //create a second svg element to hold the bar chart
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");
    
        //create a rectangle for chart background fill
        var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

     //Example 2.4 line 8...set bars for each shape
     var bars = chart.selectAll(".bars")
         .data(vegdata_csv)
         .enter()
         .append("rect")
         .sort(function(a, b){
                return b[expressed]-a[expressed]
            })
         .attr("class", function(d){
             return "bars " + d.fid2;
         })
         .attr("width", chartWidth / vegdata_csv.length -1)
         .on("mouseover", function (d){
             highlight(this);
         })
         .on("mouseout", function (d){
             dehighlight(this)
         })
         
         .on("mousemove", moveLabel);

         
         //add style descriptor
         var desc = bars.append("desc")
         .text('{"stroke":"none","stroke width: "0px"}')
        //below Example 2.8...create a text element for the chart title
        var chartTitle = chart.append("text")
            .attr("x", 55)
            .attr("y", 30)
            .attr("class", "chartTitle")
            .text("Number of Variable " + expressed + " in each region of Wisconsin");
       
       //create vertical axis generator
       var yAxis = d3.axisLeft()
       .scale(yScale);
    
        //place axis
        var axis = chart.append("g")
       .attr("class", "axis")
       .attr("transform", translate)
       .call(yAxis);
;
    
        //create frame for chart border
        var chartFrame = chart.append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);

        //set bar positions, heights, and colors
        updateChart(bars, vegdata_csv.length, colorScale);
        
    }; //end of function setChart
    
    function createDropdown(vegdata_csv){
        //add select element
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function(){
                changeAttribute(this.value, vegdata_csv)
            });
    
        //add initial option
        var titleOption = dropdown.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Attribute");
    
        //add attribute name options
        var attrOptions = dropdown.selectAll("attrOptions")
            .data(attrArray)
            .enter()
            .append("option")
            .attr("value", function(d){ return d })
            .text(function(d){ return d }); 
    };
    //dropdown change listener handler
    function changeAttribute(attribute, vegdata_csv){
        //change the expressed attribute
        expressed = attribute;

        // change yscale dynamically
        // csvmax = d3.max(vegdata_csv, function(d) { return parseFloat(d[expressed]); });

        // yScale = d3.scaleLinear()
        // .range([chartHeight - 10, 0])
        // .domain([0, csvmax*1.1]);

        // //updata vertical axis 
        // d3.select(".axis").remove();
        // var yAxis = d3.axisLeft()
        //     .scale(yScale);

        // //place axis
        // var axis = d3.select(".chart")
        //     .append("g")
        //     .attr("class", "axis")
        //     .attr("transform", translate)
        //     .call(yAxis);
    

        //recreate the color scale
        var colorScale = makeColorScale(vegdata_csv);
    
        //recolor enumeration units
        var wisconsin = d3.selectAll(".wisconsin")
            .transition()
            .duration(1000)
            .style("fill", function(d){
                return choropleth(d.properties, colorScale)
            });
        
        //re-sort, resize, and recolor bars
        var bars = d3.selectAll(".bars")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .transition()
        .delay (function(d,i){
            return i*20
        })
         updateChart(bars, vegdata_csv.length, colorScale);

        }; //end of function changeAttribute

        //function to position, size, and color bars in chart
        function updateChart(bars, n, colorScale){
        //position bars
        bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //resize bars
        .attr("height", function(d, i){
            return 600 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
        var chartTitle = d3.select(".chartTitle")
        .text("The " + expressed + " in each region of Wisconsin");
        };    
    
    //function to highlight enumeration units and bars
    function highlight(props){

    //change stroke
    var selected = d3.selectAll("." + props.fid2)
        .style("stroke", "blue")
        .style("stroke-width", "2");

    setLabel(props);
};

//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.fid2)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    d3.select(".infolabel")
        .remove();

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
};

function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.fid2 + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
};

//function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;
    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75;
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

     //horizontal label coordinate, testing for overflow
     var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
     //vertical label coordinate, testing for overflow
     var y = d3.event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};

})(); //last line of main.js
