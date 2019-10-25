const cfLeafletMapWithMarkers = {

    make : function( element, data, layout ) {

        cfLeafletMapWithMarkers.update( element, data, layout );

    }, 

    update : function ( element, data, layout ) {
     
        //var marginDefault = {top: 20, right: 20, bottom: 30, left: 20};
        //var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        var container = d3.select(element);

        var width = container.node().offsetWidth,
            height = layout.height;

        container.select(".plotArea").remove();

        // always make a new map
        var mapDiv = container.append("div")
            .attr("id", "mapnow")
            .style("width", width+'px')
            .style("height", height+'px')
            .attr("class", "plotArea");

        var dimId = data.cfData.dataProperties.indexOf( data.xProperty );

        var cf = data.cfData.cf;
        var property = data.xProperty;

        var dim = data.cfData.metaDims[ dimId ];
        var items = dim.top( Infinity );

        var map = L.map('mapnow');

        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        var markers=[];
        items.forEach( function (item) {
            var marker = L.marker([ item[ property ].lat, item[ property ].long ]);
            if (item.label != undefined) {
                marker.bindPopup( item.label );
            }
            markers.push(marker);
        });

        var markerGroup = L.featureGroup(markers).addTo(map);
        map.fitBounds(markerGroup.getBounds().pad(0.5));

 

    }
};

export { cfLeafletMapWithMarkers };