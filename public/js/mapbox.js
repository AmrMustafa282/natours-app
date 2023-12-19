
const mapBox = document.getElementById('map');
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);



mapboxgl.accessToken =
  'pk.eyJ1IjoiYW1ybXVzdGFmYTk5IiwiYSI6ImNscHlvd2EzZzB6bnYya251d3V2OGhlNmIifQ.YXfvLLHkLUGbB7xLkyzlYA';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/amrmustafa99/clpypzhkn003001qwfnizbjwd/draft',
  scrollZoom:false
});
const bounds = new mapboxgl.LngLatBounds();
locations.forEach((loc) => {
  // Create marker
  const el = document.createElement('div');
  el.className = 'marker';

  // Add marker
  new mapboxgl.Marker({
    element: el,
    anchor: 'bottom',
  })
    .setLngLat(loc.coordinates)
    .addTo(map);
  
  // Add popup
  new mapboxgl
    .Popup({offset: 40})
    .setLngLat(loc.coordinates)
    .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    .addTo(map)
  // Extend the map bounds to include current locations
  bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
  padding: {
    top: 200,
    bottom: 150,
    left: 100,
    right: 100,
  },
});
}