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

import RotatedMarker from './rotated_marker';

import {IOS, platform} from '@vkontakte/vkui';

import PanelHeaderButton from '@vkontakte/vkui/dist/components/PanelHeaderButton/PanelHeaderButton';
import Icon28ChevronBack from '@vkontakte/icons/dist/28/chevron_back';
import Icon24Back from '@vkontakte/icons/dist/24/back';


import axios from 'axios';

import { Map, TileLayer, Tooltip, Circle, CircleMarker, Marker, Polyline, Popup, WMSTileLayer } from 'react-leaflet';

import L, { polyline } from 'leaflet';
import routes from './routes.json';
import stops from './stops.json';

import './visible.css';

const sleep = ms => new Promise(res => setTimeout(res, ms));
const osName = platform();

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

const iconBus = new L.Icon({
    iconUrl: require('./bus_8x13.png'),
    iconRetinaUrl: require('./bus_8x13.png'),
    iconAnchor: null,
    popupAnchor: null,
    shadowUrl: null,
    shadowSize: null,
    shadowAnchor: null,
    iconSize: new L.Point(8, 13),
    className: 'leaflet-div-icon'
});

const iconTram = new L.Icon({
    iconUrl: require('./tram_8x13.png'),
    iconRetinaUrl: require('./tram_8x13.png'),
    iconAnchor: null,
    popupAnchor: null,
    shadowUrl: null,
    shadowSize: null,
    shadowAnchor: null,
    iconSize: new L.Point(8, 13),
    className: 'leaflet-div-icon'
});

const iconTrolley = new L.Icon({
    iconUrl: require('./trolley_8x13.png'),
    iconRetinaUrl: require('./trolley_8x13.png'),
    iconAnchor: null,
    popupAnchor: null,
    shadowUrl: null,
    shadowSize: null,
    shadowAnchor: null,
    iconSize: new L.Point(8, 13),
    className: 'leaflet-div-icon'
});


var lastOnPopStateTriggered = 0

class Home extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            id: props.id,
            go: props.go,
            fetchedUser: props.toTermInfo,
            date: new Date().getTime(),


            zoom: 13,

            now1: (new Date().getTime()/ 100) | 0,
            now2: (new Date().getTime()/ 100) | 0,
            prevnow: (new Date().getTime()/ 100) | 0,

            selectedRoute: -1,
            coordinatesOneWayLatLng: [],
            coordinatesAnWayLatLng: [],

            search: "",
            possibleSearchRoutes: [],
        };
        this.state.markers_coords = {0: [], 1: [], 2:[], 3:[]};

        this.onSearchChange = this.onSearchChange.bind(this);
        this.onSearchBlur = this.onSearchBlur.bind(this);

        this.onPopState = this.onPopState.bind(this)
        window.onpopstate = (event) => this.onPopState(event)

    }

    onPopState(event) {
        const timeNow = new Date().getTime();
        if (timeNow - lastOnPopStateTriggered <= 500) {
            window.history.pushState(null, null);
            //this.alert_pihanya("Skip Clearing")
            return
        }
        lastOnPopStateTriggered = timeNow;

        this.setState({
            coordinatesOneWayLatLng: [],
            coordinatesAnWayLatLng: []
        });
    }

    transportTypeToStr(transportType) {
        if (transportType == "bus") {
            return "автобус";
        } if (transportType == "tram") {
            return "трамвай";
        } if (transportType == "trolley") {
            return "троллейбус";
        } else {
            return "";
        }
    }

    onSearchChange(e) {
        this.setState({search: e.target.value});

        const viheclesName = this.state.inLower;
        const searchInLower = e.target.value.toLowerCase();

        const filtered = [];
        for (let index = 0; index < routes.length; ++index) {
            const route = routes[index];
            const transportTypeStr = this.transportTypeToStr(route.transport_type);
            const readable = route.route_short_name + " " + transportTypeStr;
            const readableReversed = transportTypeStr + " " + route.route_short_name;
            if (readable.startsWith(searchInLower) || readableReversed.startsWith(searchInLower)) {
                filtered.push({
                    "id": route.route_id,
                    "name": readable
                })
            }
            if (filtered.length >= 5)
                break
        }

        this.setState({
            possibleSearchRoutes: filtered
        })
    }

    async onSearchBlur(e) {
        await sleep(500)
        this.setState({
            possibleSearchRoutes: []
        })
    }

    addRouteOnMap(routeId, coordinates) {

        const stopId = routeIdToDataMap[routeId].final_stop;
        var stopData = stopIdToDataMap[stopId];

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

        this.state.selectedRoute = routeId;
        this.state.coordinatesOneWayLatLng = coordinatesOneWayLatLng;
        this.state.coordinatesAnWayLatLng = coordinatesAnWayLatLng;
        window.history.pushState(null, null);
        this.setState({
            search: ""
        });
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
            this.state.markers_coords[3] = [];
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

        if (this.state.coordinatesOneWayLatLng.length == 0) {
            this.addAllVehiclesToMap(a,b,c,d);
        } else {
            this.addOnlyTargetVehicleToMap(a,b,c,d);

        }
    }

    addOnlyTargetVehicleToMap(a,b,c,d) {
        const url = "http://transport.orgp.spb.ru/Portal/transport/internalapi/gtfs/realtime/vehicle" +
                    `?bbox=${a},${b},${c},${d}` +
                    `&routeIDs=${this.state.selectedRoute}`;
        const type = routeIdToDataMap[this.state.selectedRoute].transport_type;
        this.addVehicleTypeToMap(type, 3, url);
    }

    addAllVehiclesToMap(a,b,c,d) {
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

    getIconFromType(transportType) {
        if (transportType == "bus") {
            return iconBus;
        } if (transportType == "tram") {
            return iconTram;
        } else {
            return iconTrolley;
        }
    }

    positionToVisibleHTML(position) {
        const type = routeIdToDataMap[this.state.selectedRoute].transport_type;

        return (
        <RotatedMarker
            position={position.position}
            rotationAngle={position.direction} rotationOrigin={'center'}
            icon={this.getIconFromType(type)}
            >
        </RotatedMarker>
        );
    }

    getReadableRouteName(roudeId) {
        const routeData = routeIdToDataMap[roudeId];
        const transportTypeStr = this.transportTypeToStr(routeData.transport_type);
        return routeData.route_short_name + " " + transportTypeStr;
    }

    render() {
        const id = this.state.id;
        const go = this.state.go;
        const fetchedUser = this.state.fetchedUser;

        const position = [59.939027, 30.315901]

        const now = (new Date().getTime()/ 1000) | 0;
        const prev = this.state.prevnow;
        if (prev != this.state.now1 && prev != this.state.now2) {
            if (this.state.now1 > this.state.now2) {
                // console.log("Update 2:" + now, " because 1 is " + this.state.now1)
                this.state.now2 = now;
            } else {
                // console.log("Update 1:" + now, " because 2 is " + this.state.now2)
                this.state.now1 = now;
            }
        }
        const show1 = this.state.now1 < this.state.now2;

        this.state.prevnow = now
        // console.log("RENDER 1: " + show1 + "1: " + this.state.now1 + " 2: " + this.state.now2)
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

        {this.state.coordinatesOneWayLatLng.length == 0 && <div>
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
        </div> }

        {this.state.coordinatesOneWayLatLng.length != 0 && <div>
            {this.state.markers_coords[3].map((position) => {
                return this.positionToVisibleHTML(position);
            })}

            <Polyline positions={this.state.coordinatesOneWayLatLng} color="green" weight={4}/>
            <Polyline positions={this.state.coordinatesAnWayLatLng} weight={2}/>
        </div> }

      </Map>
      <div style={{width: "100%", position: "absolute",  zIndex: 1000}}>
        {this.state.coordinatesOneWayLatLng.length == 0 && 
            <Card size="l" mode="shadow" className="kitchens-help">
              <Search className="toppart" value={this.state.search}
                      onBlur={this.onSearchBlur} onChange={this.onSearchChange}
                      />

              {this.state.possibleSearchRoutes.map((route) => {
                  return (
                      <SimpleCell onClick={() => this.getWayOfRoute(route.id)}>
                          {route.name}
                      </SimpleCell>
                  );
              })}
            </Card>
        }
        {this.state.coordinatesOneWayLatLng.length != 0 && 
            <PanelHeader separator={false}
                left={<PanelHeaderButton onClick={() => window.history.back()}>
                    {osName === IOS ? <Icon28ChevronBack/> : <Icon24Back/>}
                </PanelHeaderButton>}
            >
                {this.getReadableRouteName(this.state.selectedRoute)}
            </PanelHeader>   
        }
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
