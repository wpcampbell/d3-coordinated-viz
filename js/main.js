/*Stylesheet by Will P. Campbell,2021*/

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    var files = ["data/vegdata.csv","data/veg_area_wgs84_simple.topojson"];
var promises = [];
files.forEach(function(url) {
    promises.push(d3.csv(url))
});
Promise.all(promises).then(function([vegdata,veg_area_wgs84_simple]) {
    console.log("This is vegdata",vegdata)//shows vegdata in console
    console.log("This is veg_area_wgs84_simple",veg_area_wgs84_simple)//shows veg_area_wgs84_simple in console

    console.log("topojson has successfully installed!")  //says if topojson is installed

});

};


