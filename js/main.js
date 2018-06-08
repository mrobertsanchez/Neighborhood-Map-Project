//global variables
var map;
var bounds;
var sanDiego = {lat: 32.7157, lng: -117.1611};
var largeInfoWindow;

//locations to show in app
var locationData = [
  {title:"Balboa Park",coordinates:{lat:32.7341479,lng:-117.14455299999997}},
  {title:"Seaport Village",coordinates:{lat:32.7094908,lng:-117.17087570000001}},
  {title:"Balboa Theatre",coordinates:{lat:32.7143617,lng:-117.1613405}},
  {title:"Hotel Del Coronado",coordinates:{lat:32.68075450000001,lng:-117.17798440000001}},
  {title:"Gaslamp Quarter",coordinates:{lat:32.7114267,lng:-117.15993049999997}},
  {title:"Petco Park",coordinates:{lat:32.7076563,lng:-117.15690430000001}},
  {title:"USS Midway Museum",coordinates:{lat:32.71373979999999,lng:-117.17512650000003}}
];
//call function on click event to display side nav
function w3_open() {
    document.getElementById("mySidebar").style.display = "block";
}
//call function on click event to hide side nav
function w3_close() {
    document.getElementById("mySidebar").style.display = "none";
}
//Initiates Google Maps API, places map, creates boundaries and runs ViewModel
function initMap(){

  map = new google.maps.Map(document.getElementById('map'), {
    center: sanDiego,
    zoom: 15,
    mapTypeControl: false
  });

  largeInfoWindow = new google.maps.InfoWindow();
  bounds = new google.maps.LatLngBounds();
  ko.applyBindings(new ViewModel());
}

//toggles marker bounce - with predefined timeout
function toggleBounce(marker) {
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){
      marker.setAnimation(null);
    },1600);
  }
}



//Model for locations
var LocModel = function(data) {
  var self = this;
  this.title = ko.observable(data.title);
  this.position = ko.observable(data.coordinates);
  this.visible = ko.observable(true);

  self.marker = new google.maps.Marker({
    position: new google.maps.LatLng(data.coordinates),
    title: data.title,
    animation: google.maps.Animation.DROP
  });

  self.filterMarkers = ko.computed(function(){
    if(self.visible() === true) {
      self.marker.setMap(map);
      bounds.extend(self.marker.position);
      map.fitBounds(bounds);
    } else {
      self.marker.setMap(null);
    }
  });
//if marker is clicked listener will pan to marker, call toggleBounce functions
//and create infoWindow
  this.marker.addListener('click', function() {
    populateInfoWindow(this, largeInfoWindow);
    toggleBounce(this);
    map.panTo(this.getPosition());
  });
//if item in sidebar list is clicked
  this.show = function(location) {
    google.maps.event.trigger(self.marker, 'click');
  };
};

var ViewModel = function(){
  var self = this;

  self.sdLocations= ko.observableArray([]);
  self.query = ko.observable('');

  locationData.forEach(function(location){
    self.sdLocations.push(new LocModel(location));
  });
// function to display filtered location list and markers
  self.filteredPlaces = ko.computed(function(){
    var query = self.query().toLowerCase();
    if(!query){
      ko.utils.arrayForEach(self.sdLocations(), function (place){
        place.marker.setVisible(true);
      });
      return self.sdLocations();
    } else {
      return ko.utils.arrayFilter(self.sdLocations(), function(place){
        var result = (place.title().toLowerCase().search(query) >= 0);
        place.marker.setVisible(result);
        return result;
      });
    }
  });
};

//populates infoWindow upon click event
function populateInfoWindow(marker, infowindow) {
  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
    // Clear the infowindow content to give the streetview time to load.
    infowindow.setContent('');
    infowindow.marker = marker;
    // Make sure the marker property is cleared if the infowindow is closed.
    infowindow.addListener('closeclick',  function() {
      infowindow.marker = null;
    });
    //pulls wiki info and creates map window content
    var wikiURL = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + marker.title + '&format=json&callback=wikiCallback';

    $.ajax(wikiURL,{
      dataType: 'jsonp',
      async: true
    }).done(function(response){
      var article = response[1];
      var snippetList = response[2];
      var url = 'http://en.wikipedia.org/wiki/'+article;
      var snippet = snippetList[0];
        infowindow.setContent('<div style='+"width:200px; height:240px"+'><div>' +
          '<h3>' + marker.title + '</h3>' + '</div><hr><div>'+snippet+'</div><br><a href =' + url + '>' + article + '</a></div>');
        // Open the infowindow on the correct marker.
        infowindow.open(map, marker);
        //error handler should wikiAPI fail
      }).fail(function(jqXHR, textStatus) {
        infowindow.setContent('<div>' +
          '<h3>' + marker.title + '</h3>' + '</div><hr><p>Wikipedia not functioning at this time...</p>');
          infowindow.open(map, marker);
  });
  }
}

// this is an error handler should the map fail to load
function googleMapsError() {
    alert('Google Maps Is Not Working Right Now!');
}
