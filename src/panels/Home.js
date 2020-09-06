import React from 'react';
import PropTypes from 'prop-types';
import Panel from '@vkontakte/vkui/dist/components/Panel/Panel';
import PanelHeader from '@vkontakte/vkui/dist/components/PanelHeader/PanelHeader';
import Button from '@vkontakte/vkui/dist/components/Button/Button';
import Group from '@vkontakte/vkui/dist/components/Group/Group';
import Cell from '@vkontakte/vkui/dist/components/Cell/Cell';
import Div from '@vkontakte/vkui/dist/components/Div/Div';
import Avatar from '@vkontakte/vkui/dist/components/Avatar/Avatar';
import FixedLayout from '@vkontakte/vkui/dist/components/FixedLayout/FixedLayout';
import Search from '@vkontakte/vkui/dist/components/Search/Search';
import SimpleCell from '@vkontakte/vkui/dist/components/SimpleCell/SimpleCell';
import Card from '@vkontakte/vkui/dist/components/Card/Card';



import axios from 'axios';

import { Map, TileLayer, Tooltip, Circle, CircleMarker, Polyline, Popup, WMSTileLayer } from 'react-leaflet';

import L, { polyline } from 'leaflet';
import routes from './routes.json';
import stops from './stops.json';

import './visible.css';

var routeIdToDataMap = {};
for (var i = 0; i < routes.length; i++) {
    routeIdToDataMap[routes[i].route_id] = routes[i];
}

var stopIdToDataMap = {};
for (var i = 0; i < stops.length; i++) {
    stopIdToDataMap[stops[i].stop_id] = stops[i];
}

var GtfsRealtimeBindings = require('gtfs-realtime-bindings');
var request = require('request');

function degrees_to_radians(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}

function getCircleX(degrees, radius) {
    const radians = degrees_to_radians(degrees);
    return Math.cos(radians) * radius;
}

function getCircleY(degrees, radius) {
    const radians = degrees_to_radians(degrees);
    return Math.sin(radians) * radius;
}



class Home extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            id: props.id,
            go: props.go,
            fetchedUser: props.toTermInfo,
            date: new Date().getTime(),


            lat: 59.905,
            lng: 30.36,
            zoom: 13,
            now1: (new Date().getTime()/ 100) | 0,
            now2: (new Date().getTime()/ 100) | 0,
            prevnow: (new Date().getTime()/ 100) | 0,

            coordinatesOneWayLatLng: [],
            coordinatesAnWayLatLng: [],
        };
        this.state.markers_coords = {0: [], 1: [], 2:[]};
    }

    addRouteOnMap(routeId, coordinates) {
        console.log(routeId)

        const stopId = routeIdToDataMap[routeId].final_stop;
        var stopData = stopIdToDataMap[stopId];

        console.log("StopID: " + stopId);
        const stopDot = (stopData == undefined) ? [0, 0] : [stopData.stop_lat,stopData.stop_lon]

        const coordinatesOneWayLatLng = [];
        for (var i = 0; i < coordinates.length; i++ ) {
            const EPSG3857_x = coordinates[i][0];
            const EPSG3857_y = coordinates[i][1];
            const latlng = L.CRS.EPSG3857.unproject(new L.Point(EPSG3857_x, EPSG3857_y));

            const diffLat = Math.abs(latlng.lat - stopDot[0])
            const diffLng = Math.abs(latlng.lng == stopDot[1])
            const elps = 0.0000001;
            if (diffLat < elps && diffLng < elps) {
                break;
            }
            coordinatesOneWayLatLng.push(latlng);
        }

        const coordinatesAnWayLatLng = [];
        while (i < coordinates.length) {
            const EPSG3857_x = coordinates[i][0];
            const EPSG3857_y = coordinates[i][1];
            const latlng = L.CRS.EPSG3857.unproject(new L.Point(EPSG3857_x, EPSG3857_y));
            coordinatesAnWayLatLng.push(latlng);
            i++;
        }

        this.state.coordinatesOneWayLatLng = coordinatesOneWayLatLng;
        this.state.coordinatesAnWayLatLng = coordinatesAnWayLatLng;
    }

    getWayOfRoute(routeId) {
        const addRouteOnMap = this.addRouteOnMap.bind(this)
        axios({
            method: 'get',
            url: "http://localhost:5000/way?" + `route_id=${routeId}`,
        }).then((response) => {
            console.log(response)
            if (response.status == 200) {
                addRouteOnMap(routeId, response.data);
            }
        }).catch(async (error) => {
            console.log(error)
        });
    }

    mappingViheclesTimer() {

        const zoom = this.refs.map.leafletElement.getZoom(); 
        if (zoom <= 12) {
            this.state.markers_coords[0] = [];
            this.state.markers_coords[1] = [];
            this.state.markers_coords[2] = [];
            this.setState({});
            return;
        }
        const bounds = this.refs.map.leafletElement.getBounds();
        // bounds._northEast.lat 

        // console.log(bounds)

        const a = bounds._northEast.lng;
        const b = bounds._northEast.lat;
        const c = bounds._southWest.lng;
        const d = bounds._southWest.lat;
        this.addVehiclesToMap(a,b,c,d);

    }

    addVehiclesToMap(a,b,c,d) {
        const url = "http://transport.orgp.spb.ru/Portal/transport/internalapi/gtfs/realtime/vehicle" +
                    `?bbox=${a},${b},${c},${d}`;


        const addVehicleTypeToMap = this.addVehicleTypeToMap.bind(this)

        const vehicles = ["bus","trolley","tram"];
        vehicles.forEach((vehicleType, idx) => {
            addVehicleTypeToMap(vehicleType, idx, url)
        });
    }

    addVehicleTypeToMap(vehicleType, idx, urlTemplate) {
        const requestSettings = {
          method: 'GET',
          url: urlTemplate + `&transports=${vehicleType}`,
          encoding: null
        };

        const state = this.state;
        const setState = this.setState.bind(this)

        request(requestSettings, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            state.markers_coords[idx] = [];
            var feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(body);
            // console.log("HEY" + feed.length)
            feed.entity.forEach(function(entity) {
              state.markers_coords[idx].push(
                {
                  "type": idx,
                  "id": entity.vehicle.trip.routeId,
                  "direction": entity.vehicle.position.bearing,
                  "position": [entity.vehicle.position.latitude, entity.vehicle.position.longitude]
                }
                );
            });

            setState({});
          } else {
              console.log("ERROR")
          }
        });
    }

    componentDidMount() {
        // console.log("LOLOLOLOLOLOLOLOLOL")
        setInterval(() => this.mappingViheclesTimer(), 5000);
        this.mappingViheclesTimer();

    }

    getMarkerradius(zoom) {
        if (zoom >= 17) {
            return 10
        } else if (zoom >= 15) {
            return 8;
        } else {
            return 6
        }
    }

    positionToHTML(position) {

        const zoom = this.refs.map.leafletElement.getZoom(); 
        if (routeIdToDataMap[position.id] == undefined) {
            // console.log(position.id)
        }

        return (
        <CircleMarker
            center={position.position}
            radius={this.getMarkerradius(zoom)}
            color={"#000000"}
            weight={0}
            fill={true}
            fillOpacity={0}

            onclick={(e) => {this.getWayOfRoute(position.id);}}
            
            style={{boxShadow: "4px 4px 3px grey"}}
            >
        </CircleMarker>
        );

    }

    render() {
        const id = this.state.id;
        const go = this.state.go;
        const fetchedUser = this.state.fetchedUser;

        const position = [this.state.lat, this.state.lng]

        const now = (new Date().getTime()/ 1000) | 0;
        const prev = this.state.prevnow;
        if (prev != this.state.now1 && prev != this.state.now2) {
            if (this.state.now1 > this.state.now2) {
                console.log("Update 2:" + now, " because 1 is " + this.state.now1)
                this.state.now2 = now;
            } else {
                console.log("Update 1:" + now, " because 2 is " + this.state.now2)
                this.state.now1 = now;
            }
        }
        const show1 = this.state.now1 < this.state.now2;

        this.state.prevnow = now
        console.log("RENDER 1: " + show1 + "1: " + this.state.now1 + " 2: " + this.state.now2)
        return (
    // <Panel id={id}>
    <div style={{width: "100%", height: "100%", position: "relative"}}>
        <Map center={position} zoom={this.state.zoom} ref='map'
                         style={{ width: '100%', height: '100%', position: "absolute"}}
                         zoomControl={false}
                         >
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png"
        //   url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <WMSTileLayer
        opacity= {show1 ? 1 : 0}
          url="http://localhost:5000/map"
            layers= 'vehicle_bus,vehicle_tram,vehicle_trolley'
            format= 'image/png'
            wheelchaironly= {false}
            transparent= {true}
            uppercase= {true}

            _olSalt = {this.state.now1}
        />

        <WMSTileLayer
        opacity= {show1 ? 0 : 1}
          url="http://localhost:5000/map"
            layers= 'vehicle_bus,vehicle_tram,vehicle_trolley'
            format= 'image/png'
            wheelchaironly= {false}
            transparent= {true}
            uppercase= {true}

            _olSalt = {this.state.now2}
        />

        {this.state.markers_coords[0].map((position) => {
            return this.positionToHTML(position);
        })}
        {this.state.markers_coords[1].map((position) => {
            return this.positionToHTML(position);
        })}
        {this.state.markers_coords[2].map((position) => {
            return this.positionToHTML(position);
        })}

        {this.state.coordinatesOneWayLatLng.length != 0 && <div>
            <Polyline positions={this.state.coordinatesOneWayLatLng} color="green" weight={4}/>
            <Polyline positions={this.state.coordinatesAnWayLatLng} weight={2}/>
        </div> }

      </Map>
      <div style={{width: "100%", position: "absolute",  zIndex: 1000}}>
      <Card size="l" mode="shadow" className="kitchens-help">


        <Search className="toppart"/>
        {/* <SimpleCell> 17 автобус </SimpleCell>
        <SimpleCell> 17 автобус </SimpleCell>
        <SimpleCell> 17 автобус </SimpleCell>
        <SimpleCell> 17 автобус </SimpleCell> */}
        </Card>
      </div>
    </div>
	// </Panel>

        );
    }
}

Home.propTypes = {
	id: PropTypes.string.isRequired,
	go: PropTypes.func.isRequired,
	fetchedUser: PropTypes.shape({
		photo_200: PropTypes.string,
		first_name: PropTypes.string,
		last_name: PropTypes.string,
		city: PropTypes.shape({
			title: PropTypes.string,
		}),
	}),
};

export default Home;
