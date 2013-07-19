// add HTML5 support to IE
document.createElement('header');
document.createElement('footer');
document.createElement('section');
document.createElement('aside');
document.createElement('nav');
document.createElement('article');

google.load("maps", "3", {other_params: "sensor=false", "language": "en"});

var latlon;
var lat;
var lon;
var myOptions;
var map;
var infowindow;
var yah;
var contents = new Array();
var marker_arr = new Array();
var hm_marker_arr = new Array();
var ib;
var marker;
var pin;
var ibArray = new Array();
var newibArray = new Array();
var shadow;
var geocoder;
var default_lat;
var default_lon;
var record_lat;
var record_lon;
var record_zoom;
var us_lat = 36;
var us_lon = -97;
var locname;
var input_address;
var medical_facilities = '1,2,3,4';
var radius;
var default_zoom = 3;

// Map Styles
var vf = [
    { "featureType": "water", "stylers": [
        { "color": "#a7c6d9" }
    ] },
    { "featureType": "transit", "stylers": [
        { "visibility": "off" }
    ] },
    { "featureType": "poi", "stylers": [
        { "visibility": "off" }
    ] },
    { "featureType": "landscape", "stylers": [
        { "color": "#efefef" }
    ] },
    { "featureType": "poi.park", "stylers": [
        { "visibility": "on" },
        { "color": "#dadada" }
    ] },
    { "featureType": "road", "elementType": "labels.icon", "stylers": [
        { "visibility": "off" }
    ]},
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [
        { "color": "#e1af49" },
        { "visibility": "simplified" }
    ]},
    { "featureType": "road.arterial", "elementType": "geometry", "stylers": [
        { "color": "#edcf92" },
        { "visibility": "simplified" }
    ]},
    { "featureType": "road.local", "elementType": "geometry", "stylers": [
        { "color": "#ffffff" },
        { "visibility": "simplified" }
    ]},
    { "elementType": "labels.text.stroke", "stylers": [
        { "color": "#808080" },
        { "visibility": "off" }
    ]}
];

// Geo-location functions
// this is for Firefox mainly - if we get to w3c geolocation and permission
// has not been granted to use location, we need to error out
var timerId = window.setInterval(timedout, 10000);

function jsgeolocate(map) {
    $.getJSON("http://jsonip.appspot.com?callback=?",
        function(data){
            var query = Object();
            query['ip'] = data.ip;
            $.ajax({url: 'getByIp.php', dataType: 'json', data: query,
                success: function(resp) {
                    if(resp) {
                        google_geo_by_ll(resp['lat'], resp['lon']);
                        return;
                    } else {
                        w3c_geolocate();
                        return;
                    }
                }
            });
        });
}

function w3c_geolocate() {
    // Last but not least, try W3C Geolocation method (Preferred)
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition( w3c_success, timedout );
    } else {
        // Browser doesn't support Geolocation
        serve_map();  //just serve the map without lat/lon
    }
}

function w3c_success(position) {
    google_geo_by_ll(position.coords.latitude, position.coords.longitude);
}

function timedout() {
    serve_map();  //just serve the map without lat/lon
}

// client-side geocoding
function google_geo(addr) {
    geocoder = new google.maps.Geocoder();
    geocoder.geocode( {'address': addr }, function(results, status) {
        if(status == "OK") {
            // see if you can get a postal code
            var zip;
            $.each(results[0].address_components, function(componentIndex, componentValue) {
                if ($.inArray("postal_code", componentValue.types) != -1) {
                    zip = componentValue.long_name;
                }
            });
            serve_map(results[0].geometry.location.lat(), results[0].geometry.location.lng(), results[0].formatted_address, '', '', zip);
        } else {
            serve_map('','','',addr);
        }
    });
}

function google_geo_by_ll(lat, lon) {
    geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(lat, lon);
    geocoder.geocode( {'latLng': latlng }, function(results, status) {
        if(status == "OK") {
            // see if you can get a postal code
            var zip;
            $.each(results[0].address_components, function(componentIndex, componentValue) {
                if ($.inArray("postal_code", componentValue.types) != -1) {
                    zip = componentValue.long_name;
                }
            });
            serve_map(lat, lon, results[0].formatted_address, '', '', zip);
        } else {
            serve_map('','','',addr);
        }
    });
}

// Map functions
function clear_markers() {
    // clear any markers on there first
    if (marker_arr) {
        for (var i in marker_arr) {
            marker_arr[i].setMap(null);
        }
    }
}

function serve_map(showlat, showlon, showaddr, searchstr, updatemarkers, zip) {
    // made it here, so not going to timeout on locating the user
    clearInterval(timerId);
    // update the global variable
    lat = showlat;
    lon = showlon;
    locname = showaddr;
    if (lat || searchstr) {
        if (showaddr) {
            $('#searchloc').text(showaddr);
        }
        // get the markers around that lat/lon OR for the searchstr
        var query = Object();
        if (searchstr) {
            query['searchstr'] = searchstr;
        } else {
            query['lat'] = lat;
            query['lon'] = lon;
            query['locname'] = showaddr;
        }
        query['medical_facilities'] = medical_facilities;
        query['radius'] = radius;
        query['zip'] = zip; // this is just for the cookie
        $.ajax({url: 'getMarkers.php', dataType: 'json', data: query,
            success: function (jsonData) {
                clear_markers();
                // for changing medical_facility selections, don't need to recenter or rezoom map
                if (!updatemarkers) {
                    latlon = new google.maps.LatLng(jsonData['lat'], jsonData['lon']);
                    map.setCenter(latlon);
                    zoom = parseInt(jsonData['zoom']);
                    map.setZoom(zoom);
                    // you are here icon
                    if (typeof(yah) == "undefined") {
                        var you_icon = new google.maps.MarkerImage('images/you.png', new google.maps.Size(24, 20), new google.maps.Point(0, 0), new google.maps.Point(0, 20));
                        yah = new google.maps.Marker({ position: latlon, map: map, icon: you_icon, zIndex: 1, title: 'You are here' });
                    } else {
                        yah.setPosition(latlon);
                    }
                }
                var listview = "";
                var pin;
                for (var i = 0; i < jsonData.markers.length; i++) {
                    latlon = new google.maps.LatLng(jsonData.markers[i].lat, jsonData.markers[i].lon);
                    label = jsonData.markers[i].label;
                    id = jsonData.markers[i].id;
                    pin = new google.maps.MarkerImage('images/pins/' + id + '.png', new google.maps.Size(32, 32), new google.maps.Point(0, 0), new google.maps.Point(0, 32));
                    contents[id] = jsonData.markers[i].html_marker;
                    var provider_name = jsonData.markers[i].provider;
                    var pname = provider_name.replace("'", "");
                    listview += '<li><div class="marker"><img src="images/pins/list_view/' + id + '.png" /></div><div class="text"><a href="javascript:om(' + id + ',\'' + pname + '\');"><strong>' + jsonData.markers[i].provider + '</strong></a><br />' + jsonData.markers[i].html_side + '</div></li>';
                    marker = new google.maps.Marker({ position: latlon, map: map, title: label, shadow: shadow, icon: pin });
                    marker_arr[id] = marker;
                    getInfoWindowEvent(marker, id);
                }
                listview = listview ? '<ul>' + listview + '</ul><span class="nt">You can also contact your physician.</span>' : 'No Results';
                $('#list_view').html(listview);
                $("#list_view ul").quickPagination({pageSize: 4});
                if (listview == "No Results") {
                    $("#list_view").removeClass("showlist");
                    $("#list_view").addClass("hidelist");
                    $("#map_canvas").css("left", "0px");
                    google.maps.event.trigger(map, 'resize');
                    map.setZoom(map.getZoom());
                    $('#close_list').click(function () {
                        $('#list_view').slideUp(250);
                        $('#close_list').hide();
                        $('#show_list').fadeIn(300);
                        $("#map_canvas").css("left", "0px");
                    });
                    $('#show_list').click(function () {
                        $('#show_list').hide();
                        $('#list_view').slideDown(250);
                        $('#close_list').fadeIn(500);
                        $("#map_canvas").css("left", "0px");
                    });
                }
                if (listview != "No Results") {
                    $("#list_view").removeClass("hidelist");
                    $("#list_view").addClass("showlist");
                    $("#map_canvas").css("left", "250px");
                    $('#show_list').hide();
                    $('#list_view').slideDown(250);
                    $('#close_list').fadeIn(500);
                    $('#close_list').click(function () {
                        $('#list_view').slideUp(250);
                        $('#close_list').hide();
                        $('#show_list').fadeIn(300);
                        $("#map_canvas").css({'left': '0px'});
                        google.maps.event.trigger(map, 'resize');
                        map.setZoom(map.getZoom());
                    });
                    $('#show_list').click(function () {
                        $('#show_list').hide();
                        $('#list_view').slideDown(250);
                        $('#close_list').fadeIn(500);
                        $("#map_canvas").css("left", "250px");
                    });

                }
            }
        });
    } else {
        $('#searchloc').text('No location specified.');
        var listview = "";
        listview = listview ? '<ul>' + listview + '</ul>' : 'No Results';
        $('#list_view').html(listview);
        $("#list_view ul").quickPagination({pageSize: "3"});
        if (listview == "No Results") {
            $("#list_view").removeClass("showlist");
            $("#list_view").addClass("hidelist");
            $("#map_canvas").css("left", "0px");
            google.maps.event.trigger(map, 'resize');
            map.setZoom(map.getZoom());
        }

    }
}

function om(id, provider_clicked) {
    // track the click in ga
    _gaq.push(['_trackEvent', 'InfoBox Clicked', provider_clicked]);
    var boxText = document.createElement("div");
    boxText.style.cssText = "border: 1px solid #fff; -webkit-box-shadow: 6px 6px 7px 0px rgba(0,0,0,.1); box-shadow: 6px 6px 7px 0px rgba(0,0,0,.1); border-radius: 2px; background: #ffffff; background: rgba(255,255,255,.93); max-height: 300px; overflow: auto; margin-top: 8px; padding: 10px;";
    boxText.innerHTML = contents[id];
    var boxOptions = {
        content: boxText, pixelOffset: new google.maps.Size(-41, -5), infoBoxClearance: new google.maps.Size(20, 20), maxWidth: 0, zIndex: 999, boxStyle: { opacity: 1, width: "320px" }, closeBoxMargin: "0px 0px 0px 0px", closeBoxURL: "images/close.png"
    };
    var ib = new InfoBox(boxOptions);
    closeInfoboxes();
    newibArray[id] = ib;
    ib.open(map, marker_arr[id]);
}

function getInfoWindowEvent(marker, counter) {
    var boxText = document.createElement("div");
    boxText.style.cssText = "border: 1px solid #fff; -webkit-box-shadow: 6px 6px 7px 0px rgba(0,0,0,.1); box-shadow: 6px 6px 7px 0px rgba(0,0,0,.1); border-radius: 2px; background: #fff; background: rgba(255,255,255,.93); max-height: 300px; overflow: auto; margin-top: 8px; padding: 10px;";
    boxText.innerHTML = contents[counter];
    var boxOptions = {
        content: boxText, pixelOffset: new google.maps.Size(-41, -5), infoBoxClearance: new google.maps.Size(20, 20), maxWidth: 0, zIndex: 999, boxStyle: { opacity: 1, width: "320px" }, closeBoxMargin: "0px 0px 0px 0px", closeBoxURL: "images/close.png"
    };
    var newib = new InfoBox(boxOptions);
    ibArray[counter] = newib;
    google.maps.event.addListener(marker, "click", function (e) {
        closeInfoboxes();
        newib.open(map, this);
    });
}

function hmMarkerHandler(marker, counter) {
    var boxText = document.createElement("div");
    boxText.style.cssText = "border: 1px solid #fff; -webkit-box-shadow: 6px 6px 7px 0px rgba(0,0,0,.1); box-shadow: 6px 6px 7px 0px rgba(0,0,0,.1); border-radius: 2px; background: #fff; background: rgba(255,255,255,.93); max-height: 300px; overflow: auto; margin-top: 8px; padding: 10px;";
    boxText.innerHTML = contents[counter];
    var boxOptions = {
        content: boxText, pixelOffset: new google.maps.Size(-41, -5), infoBoxClearance: new google.maps.Size(20, 20), maxWidth: 0, zIndex: 999, boxStyle: { opacity: 1, width: "320px" }, closeBoxMargin: "0px 0px 0px 0px", closeBoxURL: "images/close.png"
    };
    var newib = new InfoBox(boxOptions);
    ibArray[counter] = newib;
    google.maps.event.addListener(marker, 'click', function () {
        closeInfoboxes();
        newib.setContent(counter);
        newib.open(map, marker);
    });
}

function closeInfoboxes() {
    if (ibArray) { // close any open infowindows
        for (var ibi in ibArray) {
            ibArray[ibi].close();
        }
    }
    if (newibArray) { // close any open infowindows
        for (var nibi in newibArray) {
            newibArray[nibi].close();
        }
    }
}

// Initialize
$(function () {

    latlon = new google.maps.LatLng(us_lat, us_lon);
    myOptions = { center: latlon, zoom: default_zoom, streetViewControl: false, mapTypeControl: false, panControl: false, zoomControlOptions: {
        style: google.maps.ZoomControlStyle.SMALL,
        position: google.maps.ControlPosition.TOP_RIGHT
    }, mapTypeId: google.maps.MapTypeId.ROADMAP, mapTypeId: 'Styled' };
    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    var styledMapType = new google.maps.StyledMapType(vf, { name: 'Styled' });
    map.mapTypes.set('Styled', styledMapType);
    default_lat = '';
    default_lon = '';
    locname = '';
    input_address = '';

    if (input_address) { // came in through query string
        google_geo(input_address);
    } else if (default_lat && default_lon) {  // came in through cookie
        if (locname) {
            serve_map(default_lat, default_lon, locname);
        } else {
            google_geo_by_ll(default_lat, default_lon);
        }
    } else { // if we don't have a user location, need to keep trying
        w3c_geolocate();
    }
    $('#search_form').submit(function () {
        google_geo($('#location').val());
        return false;
    });
    $('#search_radius').change(function () {
        radius = $(this).val();
        $.fancybox.close();
        serve_map(lat, lon, locname);
        $('#searchradius').text(radius);

    });

    // search input placeholder
    $('#location').placeHolder();

    // fancybox
    $("a.inline_hide").fancybox({
        'hideOnContentClick': true,
        'autoDimensions': true,
        'overlayColor': '#000',
        'overlayOpacity': 0.4,
        'padding': 0,
        'type': 'inline'
    });
    $("a.inline").fancybox({
        'hideOnContentClick': false,
        'autoDimensions': true,
        'overlayColor': '#000',
        'padding': 0,
        'overlayOpacity': 0.4,
        'type': 'inline'
    });
    $("a.iframe").fancybox({
        'hideOnContentClick': false,
        'width': 740,
        'height': 545,
        'overlayColor': '#000',
        'padding': 0,
        'overlayOpacity': 0.4,
        'type': 'iframe'
    });
    $("a.iframeauto").fancybox({
        'hideOnContentClick': false,
        'width': 740,
        'overlayColor': '#000',
        'padding': 0,
        'overlayOpacity': 0.4,
        'type': 'iframe'
    });

    // checkboxes
    $(".vc").click(function () {
        // first make sure at least one is checked
        if ($("input:checkbox[name=mfs]:checked").length == 0) {
            alert("You must have at least one medical_facility option selected.");
            return false;
        }
        // get all checked medical_facilities to update the query
        medical_facilities = "";
        $("input:checkbox[name=mfs]:checked").each(function () {
            if (medical_facilities) {
                medical_facilities += ",";
            }
            medical_facilities += $(this).val();
        });
        serve_map(lat, lon, locname, '', 'true');
    });

});