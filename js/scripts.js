mapboxgl.accessToken = 'pk.eyJ1IjoiamFtZXN3aWxzb25zY2h1dHRlciIsImEiOiJja2xiamw0dTIwcjZlMm5xZXR1Z2oyNTZ0In0.ykjwA7KZIseTEFrKv-4aDw';

//before we get started huge shout out to Nicholas Cowan whose code I learned a lot from and helped out with pop ups tremendously
//https://github.com/nicholascowan17/nyc-essential-workers/blob/12d5c9625bd20ab9139e7a57739978dab464d5e9/js/scripts.js#L120

// map

var options = {
  container: 'mapcountainer',
  style: 'mapbox://styles/mapbox/dark-v10',
  center: [-74.0060, 40.7128],
  zoom: 10
};

var map = new mapboxgl.Map(options);

//controls for map

var navigators = new mapboxgl.NavigationControl();
map.addControl(navigators, 'bottom-right');

//add in a geojson source

// data for income using 2018 acs survey
// https://docs.mapbox.com/mapbox-gl-js/example/updating-choropleth/ was used for fill color
map.on('style.load', function() {
//


  //income layer

  map.addSource('income', {
    type: 'geojson',
    data: './data/incomefinal.geojson'
  });


  map.addLayer({
    'id': 'income-fill',
    'type': 'fill',
    'source': 'income',
    'layout': {
      'visibility': 'none'
    },
    'paint': {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'incomeedit_Refactored_estimate'],
        0,
        '#ffffff',
        33966,
        '#ffbfbf',
        55898,
        '#ff8080',
        70390,
        '#ff4040',
        93366,
        '#ff0000',
      ],
      'fill-outline-color': '#ccc',
      'fill-opacity': 0.75
    }
  });


//add source and layer for cars and carsandpeople

  map.addSource('carsandpeeps', {
    type: 'geojson',
    data: './data/carsandpeople3.geojson'
  });



  map.addLayer({
    'id': 'cars-fill',
    'type': 'fill',
    'source': 'carsandpeeps',
    'layout': {
      'visibility': 'visible'
    },
    'paint': {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'usethispoponcar'],
        0,
        '#b3cde0',
        2000,
        '#6497b1',
        2500,
        '#005b96',
        2750,
        '#03396c',
        3000,
        '#011f4b',
      ],
      'fill-outline-color': '#ccc',
      'fill-opacity': 0.75
    }
  });

//adding in population density as a second factor

  map.addSource('popdensity', {
    type: 'geojson',
    data: './data/density.geojson'
  });

  map.addLayer({
    'id': 'density-fill',
    'type': 'fill',
    'source': 'popdensity',
    'layout': {
      'visibility': 'none'
    },
    'paint': {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'Refactored_density'],
        0,
        '#96ED89',
        15540,
        '#45BF55',
        28058,
        '#168039',
        45233,
        '#044D29',
        66342,
        '#00261C',
      ],
      'fill-outline-color': '#ccc',
      'fill-opacity': 0.75
    }
  });

  // add an empty data source, which we will use to highlight the lot the user is hovering over
  map.addSource('highlight-feature', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  });

  // add a layer for the highlighted lot
  map.addLayer({
    id: 'highlight-line',
    type: 'line',
    source: 'highlight-feature',
    paint: {
      'line-width': 3,
      'line-color': 'white',
    }
  });

  //adding in my sources that won't toggle, i.e. mta stops + mta lines

  //found at https://github.com/chriswhong/mapboxgl-nyc-subway/blob/master/js/scripts.js
  map.addSource('nyc-sub-routes', {
    type: 'geojson',
    data: 'data/nyc-subway-route.geojson'
  });

//Adding a Layer for sub routes based on Prof Whong's https://github.com/chriswhong/mapboxgl-nyc-subway/blob/master/js/subway-layer-styles.js
  map.addLayer({
    "id":"subway_routes",
      "minzoom": 8,
      "source":"nyc-sub-routes",
      "type":"line",
      "paint":{
        'line-color': '#d4d4d4',
        'line-width': 2,
      }
  });

  map.addSource('nyc-sub-stop', {
    type: 'geojson',
    data: 'data/nyc-subway-stop.geojson'
  });

//adding in subway station circles and points

map.addLayer({
  "id":"subway_stations",
      "minzoom":12,
      "source":"nyc-sub-stop",
      "type":"circle",
      "paint":{
         "circle-color":"#d3d3d3",
         "circle-radius":4,
         "circle-opacity":1,
         "circle-stroke-width":1,
       }
});

//adding in subway station labels
  map.addLayer({
    "id":"subway_stations_labels",
      "minzoom":13,
      "source":"nyc-sub-stop",
      "type":"symbol",
      "layout":{
         "text-field":"{name}",
         "symbol-placement":"point",
         "symbol-spacing":250,
         "symbol-avoid-edges":false,
         "text-size":14,
         "text-anchor":"center"
      },
      "paint":{
         "text-halo-color":"rgba(255, 255, 255, 1)",
         "text-halo-width":1,
         "text-translate":[
            1,
            20
         ],
       }
  })

//adding layer for sub stops - based on Prof. Whong's https://github.com/chriswhong/mapboxgl-nyc-subway/blob/master/js/subway-layer-styles.js


});


//popup figuring it out

var popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false
});

map.on('mousemove', function(e) {
  // query for the features under the mouse
  var features = map.queryRenderedFeatures(e.point, {
    layers: ['income-fill', 'cars-fill', 'density-fill'],
  });

  if (features.length > 0) {
    var hoveredFeature = features[0]
    if (hoveredFeature.layer.id === 'cars-fill') {
      var zipcode = hoveredFeature.properties.zcta
      var name = hoveredFeature.properties.Refactored_borough
      var carpop = hoveredFeature.properties.popovercar2dec
      var popupContent = `
       <div>
       <h2>Zip Code: ${zipcode}</h2>
       <h4>Borough: ${name}</h4>
       <p> This zip code (${zipcode}) has ${carpop} cars per person.</p>
       </div>
     `

      popup.setLngLat(e.lngLat).setHTML(popupContent).addTo(map);
    }

      if (hoveredFeature.layer.id === 'density-fill') {
        var zipcode = hoveredFeature.properties.zcta
        var name = hoveredFeature.properties.Refactored_borough
        var pop = hoveredFeature.properties.Refactored_population
        var densipop = hoveredFeature.properties.Refactored_density
        var popupContent = `
         <div>
         <h2>Zip Code: ${zipcode}</h2>
         <h4>Borough: ${name}</h4>
         <p>This zip code (${zipcode}) has a population of ${pop} and a density rate of ${densipop} people per square mile.</p>
         </div>
       `

        popup.setLngLat(e.lngLat).setHTML(popupContent).addTo(map);
      }

    if (hoveredFeature.layer.id === 'income-fill') {
      var zipcode = hoveredFeature.properties.zcta
      var name = hoveredFeature.properties.Refactored_borough
      var dollas = hoveredFeature.properties.incomeedit_Refactored_estimate
      var popupContent = `
       <div>
       <h2>Zip Code: ${zipcode}</h2>
       <h4>Borough: ${name}</h4>
       <p>This zip code (${zipcode}) has an average houseold income of $${dollas} per year. </p>
       </div>
     `

      popup.setLngLat(e.lngLat).setHTML(popupContent).addTo(map);
    } else {

    }
    // set this lot's polygon feature as the data for the highlight source
    map.getSource('highlight-feature').setData(hoveredFeature.geometry);

    // show the cursor as a pointer
    map.getCanvas().style.cursor = 'pointer';
  } else {
    // remove the Popup
    popup.remove();
    map.getCanvas().style.cursor = '';
    map.getSource('highlight-feature').setData({
      "type": "FeatureCollection",
      "features": []
    });
  }
})

// my homies at mapbox with the toggle layers:
// https://docs.mapbox.com/mapbox-gl-js/example/toggle-layers/

// had some help from a friend figuring out for loops

var toggleableLayerIds = ['cars-fill', 'income-fill', 'density-fill'];

for (var i = 0; i < toggleableLayerIds.length; i++) {
  var id = toggleableLayerIds[i];

  var link = document.getElementById(id + '-button');
  link.setAttribute('layer-id', id);

  link.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();

    toggleLayer(e.currentTarget.getAttribute('layer-id'));
  };
}

function toggleLayer(layer) {
  var visibility = map.getLayoutProperty(layer, 'visibility');
  map.setLayoutProperty(layer, 'visibility', 'visible');
  $('.' + layer + '-legend').css('display', 'table-row');
  $('#' + layer + '-button').addClass('nav-button-selected');

  for (var i = 0; i < toggleableLayerIds.length; i++) {
    var id = toggleableLayerIds[i];
    if (id !== layer) {
      map.setLayoutProperty(id, 'visibility', 'none');
      $('.' + id + '-legend').css('display', 'none');
      $('#' + id + '-button').removeClass('nav-button-selected');
    }
  }
}

//making a modal for about https://www.w3schools.com/howto/howto_css_modals.asp

// Get the modal
var modal = document.getElementById("myModal");

// Get the button that opens the modal
var btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal
btn.onclick = function() {
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

//show modal on load
$( document).ready(function() {
  $('#myModal').show();
  // Handler for .load() called.
});
