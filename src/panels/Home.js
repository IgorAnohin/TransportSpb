import React from 'react';
import PropTypes from 'prop-types';
import Panel from '@vkontakte/vkui/dist/components/Panel/Panel';
import PanelHeader from '@vkontakte/vkui/dist/components/PanelHeader/PanelHeader';
import Button from '@vkontakte/vkui/dist/components/Button/Button';
import Group from '@vkontakte/vkui/dist/components/Group/Group';
import Cell from '@vkontakte/vkui/dist/components/Cell/Cell';
import Div from '@vkontakte/vkui/dist/components/Div/Div';
import Avatar from '@vkontakte/vkui/dist/components/Avatar/Avatar';

import { Map, TileLayer, Tooltip, CircleMarker, Popup } from 'react-leaflet';

import L from 'leaflet';
import routes from './routes.json';

var routeIdToDataMap = {};

for (var i = 0; i < routes.length; i++) {
    routeIdToDataMap[routes[i].route_id] = routes[i];
}

var GtfsRealtimeBindings = require('gtfs-realtime-bindings');
var request = require('request');

const iconPerson = new L.Icon({
    iconUrl: require('./marker.png'),
    iconRetinaUrl: require('./marker.png'),
    iconAnchor: null,
    popupAnchor: null,
    shadowUrl: null,
    shadowSize: null,
    shadowAnchor: null,
    iconSize: new L.Point(60, 75),
    className: 'leaflet-div-icon'
});

class Home extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            id: props.id,
            go: props.go,
            fetchedUser: props.toTermInfo,


        lat: 59.905,
        lng: 30.36,
        zoom: 13,
        };
        this.state.markers_coords = {0: [], 1: [], 2:[]};
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
            console.log("HEY" + feed.length)
            feed.entity.forEach(function(entity) {
              state.markers_coords[idx].push(
                {
                  "type": idx,
                  "id": entity.vehicle.trip.routeId,
                  "position": [entity.vehicle.position.latitude, entity.vehicle.position.longitude]
                }
                );
            });

            setState({});
          }
        });
    }

    componentDidMount() {
        console.log("LOLOLOLOLOLOLOLOLOL")
        setInterval(() => this.mappingViheclesTimer(), 600);
        // this.mappingViheclesTimer();
    }

    getColorFromType(type) {
        if (type == 1) {
            return "blue";
        } else if (type == 2) {
            return "red";
        } else {
            return "green";
        }
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
            console.log(position.id)
        }

        const tooltip = zoom >= 15 ?
          <Tooltip direction="top" opacity={0.7} permanent>
              {routeIdToDataMap[position.id].route_short_name}
          </Tooltip> : <div/>

        

        return (
        <CircleMarker
            center={position.position}
            radius={this.getMarkerradius(zoom)}
            color={"#000000"}
            weight={1}
            fillColor={this.getColorFromType(position.type)}
            fill={true}
            fillOpacity={0.7}
            
            style={{boxShadow: "4px 4px 3px grey"}}
            >
          <Popup>
            A pretty CSS3 popup. <br /> Easily customizable.
          </Popup>
          {tooltip}
        </CircleMarker>
        );

    }

    render() {
        const id = this.state.id;
        const go = this.state.go;
        const fetchedUser = this.state.fetchedUser;

        const position = [this.state.lat, this.state.lng]

        // console.log(this.state.markers_coords)
        return (
	// <Panel id={id}>
        <Map center={position} zoom={this.state.zoom} ref='map'
                         style={{ width: '100%', height: '100%'}}
                         >
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png"
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
      </Map>
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
