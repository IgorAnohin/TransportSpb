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



import { Map, TileLayer, Tooltip, Circle, CircleMarker, Polyline, Popup, WMSTileLayer } from 'react-leaflet';

import L, { polyline } from 'leaflet';
import routes from './routes.json';

import './visible.css';

var routeIdToDataMap = {};

for (var i = 0; i < routes.length; i++) {
    routeIdToDataMap[routes[i].route_id] = routes[i];
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
        prevnow: (new Date().getTime()/ 100) | 0
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
            // console.log(position.id)
        }

        return (
        <CircleMarker
            center={position.position}
            radius={this.getMarkerradius(zoom)}
            color={"#000000"}
            weight={0}
            fillColor={this.getColorFromType(position.type)}
            fill={true}
            fillOpacity={0}
            
            style={{boxShadow: "4px 4px 3px grey"}}
            >
          <Popup>
            A pretty CSS3 popup. <br /> Easily customizable.
          </Popup>

        </CircleMarker>
        );

    }

    render() {
        const id = this.state.id;
        const go = this.state.go;
        const fetchedUser = this.state.fetchedUser;

        const position = [this.state.lat, this.state.lng]


        // const coordinates = [[3367125.945056899,8392841.759715226],[3367149.656108438,8392845.31860635],[3367204.6479368894,8392779.701827554],[3367239.2682985263,8392743.66845524],[3367267.098171224,8392721.648147814],[3367315.299510738,8392706.967979427],[3367331.1068784306,8392663.817350809],[3367460.7940852046,8392681.611393848],[3367542.2799524656,8392692.732692571],[3367595.7133080456,8392700.517611662],[3367608.5150494874,8392702.297022896],[3367855.310360576,8392738.330192849],[3368412.4644119963,8392822.185844751],[3368439.9603262222,8392826.412016928],[3368439.9603262222,8392826.412016928],[3368437.7339364067,8392852.213962799],[3368433.837754228,8392896.70028859],[3368448.4206075226,8392898.034882514]];
        const coordinates = [[3367125.945056899, 8392841.759715226], [3367149.656108438, 8392845.31860635], [3367204.6479368894, 8392779.701827554], [3367239.2682985263, 8392743.66845524], [3367267.098171224, 8392721.648147814], [3367315.299510738, 8392706.967979427], [3367331.1068784306, 8392663.817350809], [3367460.7940852046, 8392681.611393848], [3367542.2799524656, 8392692.732692571], [3367595.7133080456, 8392700.517611662], [3367608.5150494874, 8392702.297022896], [3367855.310360576, 8392738.330192849], [3368412.4644119963, 8392822.185844751], [3368439.9603262222, 8392826.412016928], [3368439.9603262222, 8392826.412016928], [3368437.7339364067, 8392852.213962799], [3368433.837754228, 8392896.70028859], [3368448.4206075226, 8392898.034882514], [3368448.4206075226, 8392898.034882514], [3368433.837754228, 8392896.70028859], [3368395.098571432, 8393340.910984714], [3368395.098571432, 8393340.910984714], [3368426.601987327, 8393338.686527923], [3368425.822750892, 8393328.009144666], [3368425.822750892, 8393328.009144666], [3368425.9340703827, 8393332.013161574], [3368430.164211032, 8393332.013161574], [3368499.293614815, 8393329.121371366], [3368568.3116991073, 8393323.560239537], [3368568.3116991073, 8393323.560239537], [3368778.3715782342, 8393306.20953523], [3368899.7098231986, 8393296.644420834], [3368929.877405204, 8393294.197533103], [3369134.8165877545, 8393277.736673111], [3369204.168630518, 8393272.175580082], [3369204.168630518, 8393272.175580082], [3369417.6794138597, 8393254.157667482], [3369453.969567858, 8393251.26590783], [3369451.7431780426, 8393221.458605312], [3369451.7431780426, 8393221.458605312], [3369466.548670318, 8393227.019660061], [3369466.659989808, 8393226.797217796], [3369549.147732486, 8393007.91727834], [3369560.168362075, 8392979.000699485], [3369560.168362075, 8392979.000699485], [3369520.0933453892, 8392973.439831948], [3369508.0708403843, 8392971.882789796], [3369505.3991726045, 8392991.234622844], [3369505.3991726045, 8392991.234622844], [3369508.0708403843, 8392971.882789796], [3368249.2700384925, 8392779.924256321], [3367276.560327942, 8392649.359722482], [3367201.642310638, 8392651.361546252], [3367165.352156639, 8392636.68151792], [3367143.1995779714, 8392611.325174246], [3367137.744922923, 8392588.193147369], [3367154.8881245046, 8392546.155322922], [3367203.200783509, 8392523.023500668], [3367282.126302481, 8392483.210245905], [3367769.594352665, 8392334.190475877], [3367980.9900656817, 8392269.245489344], [3368003.699241803, 8392249.673139911], [3368021.732999312, 8392218.53541843], [3368013.717995975, 8392162.26544128], [3367953.0488734925, 8391957.873369312], [3367877.240300262, 8391699.889295714], [3367811.784439676, 8391451.032184802], [3367788.5186661, 8391377.19952036], [3367774.047132297, 8391380.090544501], [3367752.00587312, 8391378.978612006], [3367730.855169869, 8391372.751793114], [3367711.8195369425, 8391361.632486757], [3367696.012169251, 8391346.287871543], [3367684.2123032263, 8391327.607513553], [3367677.310494798, 8391306.703359567], [3367677.310494798, 8391306.703359567], [3367675.752021927, 8391281.129209291], [3367681.4293159572, 8391255.999913324], [3367693.8970989254, 8391233.539287696], [3367711.9308564337, 8391215.303978633], [3367734.528713065, 8391202.850622775], [3367736.866422372, 8391202.183479302], [3367734.3060740833, 8391191.286811186], [3367734.3060740833, 8391191.286811186], [3367736.866422372, 8391202.183479302], [3367759.5755984937, 8391197.068714714], [3367785.1790813766, 8391198.625381825], [3367809.4467303692, 8391207.075866159], [3367830.3747946383, 8391221.975427935], [3367846.404801312, 8391241.989812074], [3367853.640568214, 8391259.558038514], [3367853.640568214, 8391259.558038514], [3368016.278344263, 8391206.408722304], [3368017.1689001895, 8391206.186341032], [3368033.644184827, 8391200.84919255], [3368036.204533115, 8391199.959668174], [3368036.204533115, 8391199.959668174], [3368038.8762008934, 8391199.29252497], [3368040.2120347833, 8391198.847762862], [3368036.8724500597, 8391189.06300334], [3368036.8724500597, 8391189.06300334], [3368042.104466127, 8391205.07443478], [3368053.904332151, 8391201.293954778], [3368304.0392279644, 8391119.680535864], [3368730.9494751557, 8390980.250437642], [3368739.743714929, 8390977.359570384], [3368793.511028982, 8390959.792016825], [3368802.0826297733, 8390957.123531342], [3368806.8693678766, 8390955.566915255], [3368800.5241569015, 8390936.22042849], [3368800.5241569015, 8390936.22042849], [3368806.8693678766, 8390955.566915255], [3369320.608817888, 8390787.89905098], [3369320.608817888, 8390787.89905098], [3369516.976399647, 8390723.857160253], [3369525.5480004377, 8390720.966393594], [3369543.2477994747, 8390715.184863677], [3369537.6818249347, 8390698.06266708], [3369537.6818249347, 8390698.06266708], [3369543.2477994747, 8390715.184863677], [3369596.235877092, 8390698.06266708], [3369596.235877092, 8390698.06266708], [3369691.525361211, 8390844.8256434], [3369692.1932781558, 8390845.715124894], [3369698.204530658, 8390855.054687086], [3369793.0487368144, 8391000.93129033], [3369793.0487368144, 8391000.93129033], [3369824.6634721993, 8391051.188228065], [3369870.193143934, 8391124.12811033], [3369906.928575896, 8391169.048762975], [3369954.684637447, 8391217.527794397], [3370002.5520184874, 8391260.225187182], [3370038.174255542, 8391292.026010295], [3370078.4719112082, 8391328.052283421], [3370113.871509281, 8391353.848982295], [3370144.7070082305, 8391320.268814439], [3370206.711964602, 8391264.895229531], [3370206.711964602, 8391264.895229531], [3370235.87767119, 8391238.876459861], [3370223.1872492395, 8391224.644009346], [3370223.1872492395, 8391224.644009346], [3370235.87767119, 8391238.876459861], [3370286.0827615373, 8391193.955381481], [3370369.4610601417, 8391129.909961155], [3370369.4610601417, 8391129.909961155], [3370401.075795527, 8391106.115450313], [3370526.0875836886, 8391011.16055076], [3370526.0875836886, 8391011.16055076], [3370590.4302493674, 8391039.624654507], [3370594.326431545, 8391033.398122413], [3370594.326431545, 8391033.398122413], [3370587.313303624, 8391044.29455703], [3370621.9336652616, 8391066.75460574], [3370653.3257616647, 8391087.213323567], [3370653.3257616647, 8391087.213323567], [3370685.8310529767, 8391108.339233115], [3370709.0968265524, 8391123.460973993], [3370753.179344906, 8391150.813613536], [3370780.6752591324, 8391167.93686233], [3370790.0260963594, 8391172.384465931], [3370823.9785410506, 8391185.94967349], [3370845.2405637926, 8391193.955381481], [3370911.6982997963, 8391220.641137592], [3371060.866417459, 8391279.572524754], [3371075.1153122806, 8391285.354497561], [3371109.1790764634, 8391298.697529063], [3371121.646859433, 8391303.589980004], [3371151.5918024555, 8391315.59873699], [3371194.2271674294, 8391332.499983685], [3371223.2815545266, 8391343.841631493], [3371273.2640058924, 8391363.633960664], [3371273.2640058924, 8391363.633960664], [3371285.0638719164, 8391368.304068562], [3371387.811761919, 8391409.000848366], [3371394.824889839, 8391391.209878722], [3371394.824889839, 8391391.209878722], [3371387.811761919, 8391409.000848366], [3371691.04605484, 8391529.091017203], [3371711.5288411453, 8391537.097098062], [3371711.5288411453, 8391537.097098062], [3371726.223013931, 8391520.862554282], [3371768.1904619597, 8391474.16064152], [3371799.5825583637, 8391442.803809062], [3371837.6538242144, 8391404.108327435], [3371861.921473207, 8391379.200998493], [3371899.6587805864, 8391341.395392256], [3371932.4980303706, 8391308.26004984], [3372045.2646745443, 8391190.842049561], [3372072.092671825, 8391168.826382833], [3372107.4922698974, 8391131.911372116], [3372119.0694969404, 8391119.680535864], [3372119.0694969404, 8391119.680535864], [3372137.9938103748, 8391099.888862025], [3372123.076998609, 8391085.656679995], [3372123.076998609, 8391085.656679995], [3372138.105129866, 8391099.888862025], [3372144.672979822, 8391092.995145423], [3372204.562865869, 8391030.284858339], [3372247.9774672785, 8390984.475553365], [3372247.9774672785, 8390984.475553365], [3372356.959248766, 8390872.399619719], [3372478.1861742386, 8390747.65043661], [3372493.659583459, 8390731.639999207], [3372529.0591815314, 8390695.17191054], [3372555.775859322, 8390593.55142064], [3372577.2605210454, 8390575.984782185], [3372712.73634134, 8390463.91506208], [3372797.2278348524, 8390394.094709387], [3372841.75563117, 8390357.40593573], [3372861.5705005312, 8390340.951635983], [3372870.030781831, 8390334.05862944], [3372877.934465678, 8390326.498565162], [3372877.934465678, 8390326.498565162], [3372905.6530188858, 8390304.26312695], [3372898.194613002, 8390294.924262915], [3372898.194613002, 8390294.924262915], [3372905.6530188858, 8390304.26312695], [3372922.7962204674, 8390290.477188963], [3372975.784298085, 8390246.673653958], [3373058.9399577077, 8390177.967110937], [3373070.739823732, 8390168.85075693], [3373070.739823732, 8390168.85075693], [3373087.103788879, 8390189.306981659], [3373117.827968337, 8390227.773731964], [3373141.9842978395, 8390257.791277776], [3373141.9842978395, 8390257.791277776], [3373154.3407613174, 8390248.007767923], [3373167.587780722, 8390244.227778964], [3373174.266950169, 8390245.5618925], [3373192.9686246226, 8390244.227778964], [3373225.6965549164, 8390240.67014407], [3373252.079274234, 8390241.114848334], [3373291.7090129564, 8390248.452472636], [3373397.0172512466, 8390278.02539617], [3373464.476862667, 8390297.147800902], [3373476.05408971, 8390300.2607552], [3373549.6362731247, 8390322.718535928], [3373569.896420448, 8390328.722112676], [3373736.541698166, 8390379.19682169], [3373750.233995534, 8390383.19923632], [3373761.5885835947, 8390386.534583507], [3373970.980545777, 8390449.906466922], [3374014.2838276955, 8390462.58090901], [3374198.6289044493, 8390516.836661931], [3374198.6289044493, 8390516.836661931], [3374277.777062403, 8390541.518714536], [3374279.2242157827, 8390536.849130675], [3374279.2242157827, 8390536.849130675], [3374277.777062403, 8390541.518714536], [3374352.3611212345, 8390564.644316329], [3374368.8364058724, 8390569.758641906], [3374368.8364058724, 8390569.758641906], [3374359.596888136, 8390601.778847978], [3374359.596888136, 8390601.778847978], [3374381.415508332, 8390610.673374362], [3374557.856901239, 8390683.386530232], [3374587.4678857895, 8390695.394276386], [3374631.2164456714, 8390713.405932307], [3374665.8368073083, 8390727.637395287], [3374748.658508459, 8390761.659597887], [3374759.4564990653, 8390766.106956236], [3374794.4108191747, 8390780.560889436], [3374828.6972223395, 8390794.79248213], [3374837.3801426217, 8390798.350384595], [3374837.3801426217, 8390798.350384595], [3374892.5946100545, 8390821.25442287], [3374905.7303099683, 8390826.813666198], [3374958.8297070763, 8390848.605940498], [3374958.8297070763, 8390848.605940498], [3374968.848461248, 8390852.608610136], [3374976.5295061124, 8390855.721799128], [3374979.980410327, 8390847.271717766], [3374979.980410327, 8390847.271717766], [3374976.5295061124, 8390855.721799128], [3375094.8621248254, 8390903.531652495], [3375452.0863707815, 8391047.407827016], [3375466.112626621, 8391053.189617636], [3375466.112626621, 8391053.189617636], [3375481.8086748235, 8391060.083296994], [3375590.2338588554, 8391108.11685481], [3375597.6922647385, 8391091.216122836], [3375597.6922647385, 8391091.216122836], [3375590.2338588554, 8391108.11685481], [3375686.3025794104, 8391150.59123394], [3375686.3025794104, 8391150.59123394], [3375701.2193911765, 8391156.81786507], [3375780.590188112, 8391191.286811186], [3375789.607066866, 8391195.512047933], [3375862.2986943554, 8391227.312591722], [3375867.9759883853, 8391229.758793088], [3375902.485030531, 8391244.880783167], [3375947.4581048116, 8391264.45046347], [3375989.8708308036, 8391282.908277748], [3376011.5781315085, 8391292.470778028], [3376022.932719569, 8391297.363224827], [3376105.3091427563, 8391333.389524056], [3376119.1127596144, 8391339.393924389], [3376194.142096409, 8391372.084634261], [3376208.057032759, 8391378.31145259], [3376208.057032759, 8391378.31145259], [3376203.1589751635, 8391387.4293032], [3376091.282886916, 8391600.478878561], [3376087.052746266, 8391608.485036988], [3376087.052746266, 8391608.485036988], [3376088.4998996463, 8391605.816316545], [3376091.282886916, 8391600.478878561], [3376087.4980242294, 8391609.81939757], [3376182.564869367, 8391643.400885176], [3376189.2440388147, 8391640.95454648], [3376189.2440388147, 8391640.95454648], [3376183.121466821, 8391643.845674118], [3376255.813094309, 8391673.201803694], [3376320.6010379503, 8391703.670031572], [3376333.848057355, 8391754.598956574], [3376336.9650030974, 8391766.608448705], [3376364.572236814, 8391876.029167607], [3376364.572236814, 8391876.029167607], [3376447.727896436, 8392198.51838126], [3376454.1844269023, 8392222.983656304], [3376468.099363252, 8392219.20265394], [3376468.099363252, 8392219.20265394], [3376454.0731074116, 8392222.761244345], [3376468.433321724, 8392278.364442626], [3376468.433321724, 8392278.364442626], [3376475.335130153, 8392294.37824156], [3376519.528967998, 8392441.840276156], [3376555.596483015, 8392510.790354794], [3376587.2112184, 8392528.361607047], [3376616.3769249883, 8392531.475504223], [3376640.9785324535, 8392533.92213864], [3377030.3741112477, 8392669.377984636], [3377046.626756904, 8392673.381643597], [3377158.0575671885, 8392707.857685773], [3377297.5408891523, 8392751.45342816], [3377297.5408891523, 8392751.45342816], [3377506.7102123527, 8392809.952202113], [3377511.385630966, 8392793.047565723], [3377511.385630966, 8392793.047565723], [3377506.7102123527, 8392809.952202113], [3377616.359910784, 8392840.647562096], [3377616.359910784, 8392840.647562096], [3377609.680741337, 8392866.004695069], [3377561.9246797864, 8393047.066058254], [3377530.5325833824, 8393186.535277426], [3377550.9040501975, 8393192.31874704], [3377559.698289971, 8393194.765600938], [3377559.698289971, 8393194.765600938], [3378244.2018388584, 8393388.069626799], [3378251.326286269, 8393362.933143212], [3378261.4563599313, 8393098.894024404], [3378267.690251415, 8393085.325294169], [3378006.7573649962, 8392966.544362035], [3377609.680741337, 8392866.004695069], [3377609.680741337, 8392866.004695069], [3377396.726555449, 8392807.950335257], [3377391.6058588726, 8392826.634447109], [3377391.6058588726, 8392826.634447109], [3377396.726555449, 8392807.950335257], [3377387.598357204, 8392805.503609834], [3377286.742898545, 8392777.922397623], [3377286.742898545, 8392777.922397623], [3377147.593535054, 8392734.548926], [3377086.8130930807, 8392711.63893893], [3377049.6323831556, 8392697.626069324], [3377040.949462874, 8392694.289675731], [3377025.4760536533, 8392687.616893068], [3376647.657701901, 8392563.281815039], [3376636.525752822, 8392559.500638032], [3376610.2543529947, 8392537.92572399], [3376573.518921033, 8392521.911395654], [3376554.81724658, 8392507.009204729], [3376540.3457127763, 8392485.87928419], [3376526.4307764266, 8392453.628469681], [3376521.532718832, 8392438.28157994], [3376479.00867335, 8392293.933413347], [3376468.433321724, 8392276.807547363], [3376468.433321724, 8392276.807547363], [3376447.727896436, 8392198.51838126], [3376444.944909166, 8392187.842650345], [3376419.1187873017, 8392194.51498036], [3376419.1187873017, 8392194.51498036], [3376444.944909166, 8392187.842650345], [3376393.403984929, 8391987.897964733], [3376364.572236814, 8391876.029167607], [3376364.572236814, 8391876.029167607], [3376336.9650030974, 8391766.608448705], [3376333.848057355, 8391754.598956574], [3376320.6010379503, 8391703.670031572], [3376320.6010379503, 8391703.670031572], [3376293.7730406695, 8391686.323141858], [3376170.3197253793, 8391639.62018025], [3376167.2027796376, 8391638.28581427], [3376156.0708305584, 8391668.086712092], [3376156.0708305584, 8391668.086712092], [3376167.2027796376, 8391638.28581427], [3376155.959511067, 8391634.06032359], [3376095.624347057, 8391611.598545395], [3376087.052746266, 8391608.485036988], [3376087.052746266, 8391608.485036988], [3376036.179738974, 8391591.583157174], [3375932.763932027, 8391557.112338254], [3375932.763932027, 8391557.112338254], [3375618.0637315544, 8391444.138139639], [3375384.404120379, 8391362.299644668], [3375377.3909924594, 8391382.314410007], [3375377.3909924594, 8391382.314410007], [3375384.404120379, 8391362.299644668], [3375383.290925471, 8391361.854872726], [3375347.6686884174, 8391349.401269147], [3375347.6686884174, 8391349.401269147], [3374865.7666127733, 8391183.503486676], [3374779.8279658803, 8391152.370270872], [3374774.8185887956, 8391166.15782164], [3374774.8185887956, 8391166.15782164], [3374779.8279658803, 8391152.370270872], [3374770.365809163, 8391148.812197441], [3374754.8923999434, 8391143.030331781], [3374754.8923999434, 8391143.030331781], [3374747.8792720223, 8391140.361779932], [3374740.6435051216, 8391137.026091482], [3374724.168220484, 8391129.909961155], [3374606.503518716, 8391070.312639544], [3374493.736874542, 8391013.161929457], [3374288.0184555557, 8390908.868585613], [3374271.0978929554, 8390900.640815346], [3374292.6938741696, 8390828.592624953], [3374298.927765654, 8390807.912255999], [3374306.163532555, 8390783.67404799], [3374335.2179196533, 8390686.722013313], [3374340.783894192, 8390667.15386747], [3374342.7876450266, 8390660.705285337], [3374346.2385492413, 8390648.475231282], [3374359.596888136, 8390601.778847978], [3374368.8364058724, 8390569.758641906], [3374368.8364058724, 8390569.758641906], [3374373.289185504, 8390555.08276063], [3374382.4173837486, 8390525.064003611], [3374356.8139008665, 8390517.28138287], [3374356.8139008665, 8390517.28138287], [3374382.4173837486, 8390525.064003611], [3374401.341697184, 8390462.58090901], [3374401.341697184, 8390462.58090901], [3374432.9564325693, 8390358.29535839], [3374454.997691746, 8390285.8077642], [3374491.2878457443, 8390165.960208017], [3374494.0708330143, 8390156.843868867], [3374494.0708330143, 8390156.843868867], [3374412.918924227, 8390130.606663045], [3374393.7719718097, 8390124.825596362], [3374371.842032124, 8390117.265746769], [3374367.611891473, 8390129.717267884], [3374367.611891473, 8390129.717267884], [3374372.2873100867, 8390116.821049973], [3374362.9364728606, 8390113.485824883], [3374355.0327890133, 8390110.817645894], [3374265.977196379, 8390078.799573394], [3374248.8339947974, 8390072.573853228], [3374248.8339947974, 8390072.573853228], [3374114.5826889, 8389993.41872694], [3373992.3538880087, 8389896.477090273], [3373931.573446036, 8389834.221665882], [3373865.4496685048, 8389737.949134553], [3373851.646051647, 8389716.827153914], [3373851.646051647, 8389716.827153914], [3373832.053821267, 8389727.721641628], [3373607.4110888466, 8389852.231216718], [3373618.654357416, 8389872.464221403], [3373618.654357416, 8389872.464221403], [3373609.080881208, 8389851.119514776], [3373397.4625292104, 8389968.516166423], [3373250.9660793263, 8390056.564882686], [3373087.7717058226, 8390157.288568078], [3373069.0700313696, 8390169.740156824], [3372882.4985648002, 8390323.16324515], [3372818.9351355573, 8390377.640327698], [3372841.199033716, 8390402.98898506], [3372841.199033716, 8390402.98898506], [3372819.4917330113, 8390377.195615193], [3372554.8853033953, 8390592.439606834], [3372554.8853033953, 8390592.439606834], [3372530.9516128753, 8390694.504813034], [3372247.3095503342, 8390984.253178798], [3372140.6654781536, 8391095.886058053], [3372166.380280527, 8391118.346264044], [3372166.380280527, 8391118.346264044], [3372142.335270516, 8391095.441302195], [3372105.265880082, 8391134.357541801], [3372069.866282009, 8391171.717325218], [3372069.866282009, 8391171.717325218], [3372045.4873135258, 8391195.734428877], [3372028.900709397, 8391212.413019152], [3371932.4980303706, 8391308.26004984], [3371899.6587805864, 8391341.395392256], [3371861.921473207, 8391379.200998493], [3371847.115980932, 8391394.323295305], [3371833.6463225456, 8391408.111298861], [3371799.5825583637, 8391442.803809062], [3371780.658244929, 8391461.70684811], [3371768.1904619597, 8391474.16064152], [3371711.5288411453, 8391537.097098062], [3371711.5288411453, 8391537.097098062], [3371273.486644875, 8391364.07873272], [3371232.18711379, 8391344.953558687], [3371152.482358382, 8391312.930122636], [3371130.8863771684, 8391306.258590976], [3371126.9901949908, 8391318.712121623], [3371126.9901949908, 8391318.712121623], [3371130.8863771684, 8391306.258590976], [3371120.533664524, 8391302.922827415], [3371074.7813538075, 8391286.02164857], [3371074.7813538075, 8391286.02164857], [3370959.1204028744, 8391243.546488678], [3370777.669632881, 8391176.609691838], [3370777.669632881, 8391176.609691838], [3370488.906873763, 8391441.469478725], [3370402.634268398, 8391520.862554282], [3370373.6912007923, 8391547.549494488], [3370373.6912007923, 8391547.549494488], [3370353.431053468, 8391525.532761844], [3370342.855701843, 8391514.190834336], [3370302.5580461756, 8391483.945779677], [3370280.8507454707, 8391512.63410055], [3370280.8507454707, 8391512.63410055], [3370299.441100433, 8391487.504014956], [3370241.6662847116, 8391444.805305015], [3370232.649405957, 8391437.911265675], [3370232.649405957, 8391437.911265675], [3370149.493746334, 8391388.763623755], [3370096.2830297356, 8391358.963855729], [3370084.371844221, 8391348.066955728], [3370031.1611276213, 8391299.364681276], [3369996.4294464937, 8391266.007144816], [3369950.7884552684, 8391221.975427935], [3369902.1418377915, 8391173.49636725], [3369862.5120990695, 8391131.02185607], [3369853.6065398064, 8391117.679128228], [3369849.9329966097, 8391112.119665422], [3369799.3939477894, 8391031.619114209], [3369747.1851066076, 8390962.238129372], [3369731.711697388, 8390940.44551897], [3369697.7592526954, 8390892.635426061], [3369667.4803512, 8390859.502101824], [3369667.4803512, 8390859.502101824], [3369648.778676746, 8390839.04401629], [3369613.2677591834, 8390811.914903518], [3369564.621141707, 8390782.339837015], [3369497.3841692675, 8390755.433300696], [3369488.367290513, 8390751.653051402], [3369489.5918049123, 8390748.762273839], [3369489.5918049123, 8390748.762273839], [3369487.254095606, 8390741.20178403], [3369323.057846685, 8390793.458269142], [3369323.057846685, 8390793.458269142], [3369285.3205393064, 8390805.688563865], [3369229.3268354377, 8390823.922859143], [3369132.033600484, 8390855.721799128], [3368816.3315245947, 8390958.680147758], [3368816.3315245947, 8390958.680147758], [3368742.4153827075, 8390982.69655698], [3368731.5060726097, 8390986.699299455], [3368735.068296315, 8390996.92854012], [3368735.068296315, 8390996.92854012], [3368729.724960757, 8390980.695186554], [3367965.4053369705, 8391230.203557054], [3367969.5241581304, 8391242.656959152], [3367969.5241581304, 8391242.656959152], [3367965.4053369705, 8391230.203557054], [3367856.646194466, 8391265.562378682], [3367856.646194466, 8391265.562378682], [3367858.8725842815, 8391290.02455584], [3367856.868833447, 8391309.149587285], [3367849.4104275643, 8391331.165673325], [3367837.6105615394, 8391347.177413587], [3367818.9088870864, 8391363.411574647], [3367795.6431135107, 8391375.42042914], [3367871.0064087776, 8391643.400885176], [3368022.178277275, 8392163.599902166], [3368026.742376398, 8392196.739091706], [3368025.5178619986, 8392218.313006613], [3368015.8330663, 8392245.669711206], [3367994.014446104, 8392266.131703], [3367969.858116603, 8392278.586856257], [3367881.359121422, 8392307.500686085], [3367780.948940726, 8392336.637044776], [3367509.774661154, 8392416.262185277], [3367439.9773404263, 8392436.947069293], [3367287.3583185486, 8392485.434444407], [3367245.5021900106, 8392516.79571478], [3367247.9512188076, 8392553.050399376], [3367269.2132415497, 8392603.540349398], [3367297.377072721, 8392659.146421632], [3367331.1068784306, 8392663.817350809], [3367460.7940852046, 8392681.611393848], [3367542.2799524656, 8392692.732692571], [3367595.7133080456, 8392700.517611662], [3367608.5150494874, 8392702.297022896], [3367855.310360576, 8392738.330192849], [3368412.4644119963, 8392822.185844751], [3368439.9603262222, 8392826.412016928], [3368439.9603262222, 8392826.412016928], [3368537.476200157, 8392838.868117444], [3368538.5893950653, 8392830.415761225], [3368538.5893950653, 8392830.415761225], [3368537.476200157, 8392838.868117444], [3368562.411766095, 8392841.982145865], [3368562.411766095, 8392841.982145865], [3368614.954565749, 8392849.767222676], [3368711.0232863035, 8392862.668225212], [3368741.9701047447, 8392866.894420616], [3368846.8330650716, 8392881.130044008], [3368864.978142071, 8392883.576794548], [3369551.708080774, 8392977.221221423], [3369575.530451804, 8392980.557743147], [3369485.2503447714, 8393242.368192956], [3369465.43547541, 8393260.608520014], [3369465.43547541, 8393260.608520014], [3369412.3360783015, 8393264.612500288], [3369414.673787608, 8393294.41997741], [3369414.673787608, 8393294.41997741], [3369412.3360783015, 8393264.612500288], [3369378.4949531006, 8393267.281821674], [3369255.820874246, 8393276.84689795], [3369204.836547463, 8393280.850887047], [3369138.2674919683, 8393285.967098512], [3369138.2674919683, 8393285.967098512], [3368936.2226161784, 8393302.205532346], [3368899.93246218, 8393304.874867361], [3368783.380955319, 8393313.105323074], [3368783.380955319, 8393313.105323074], [3368573.543715175, 8393328.009144666], [3368568.645657579, 8393328.231589988], [3368498.2917393977, 8393333.34783436], [3368445.526300762, 8393337.129408566], [3368445.30366178, 8393337.129408566], [3368447.3074126146, 8393364.935160886], [3368447.3074126146, 8393364.935160886], [3368445.30366178, 8393337.129408566], [3368395.098571432, 8393340.910984714], [3368395.098571432, 8393340.910984714], [3368437.7339364067, 8392852.213962799], [3368439.9603262222, 8392826.412016928], [3368412.4644119963, 8392822.185844751], [3367855.310360576, 8392738.330192849], [3367608.5150494874, 8392702.297022896], [3367595.7133080456, 8392700.517611662], [3367542.2799524656, 8392692.732692571], [3367460.7940852046, 8392681.611393848], [3367438.5301870457, 8392700.740038043], [3367409.58711944, 8392727.208825296], [3367376.9705086374, 8392763.2421171], [3367349.140635939, 8392834.641938122], [3367300.1600599894, 8392902.705963155], [3367199.8611987852, 8393031.2730595], [3367169.359658308, 8393061.746904353], [3367141.3071466275, 8393077.7624062], [3367110.2490086965, 8393075.31559116], [3367087.6511520655, 8393062.191778934], [3367053.030790429, 8393027.491642289], [3367042.232799822, 8392987.898096275], [3367060.823154785, 8392954.977781834], [3367086.4266376668, 8392919.61085117], [3367142.6429805174, 8392856.217721121], [3367125.945056899, 8392841.759715226]];


        const coordinatesOneWayLatLng = [];
        const example = [59.971354,30.347348];
        for (var i = 0; i < coordinates.length; i++ ) {
            const EPSG3857_x = coordinates[i][0];
            const EPSG3857_y = coordinates[i][1];
            const latlng = L.CRS.EPSG3857.unproject(new L.Point(EPSG3857_x, EPSG3857_y));
            coordinatesOneWayLatLng.push(latlng);

            if (latlng.lat == example[0] && latlng.lng == example[1]) {
                break;
            }
        }
        const coordinatesAnWayLatLng = [];
        while (i < coordinates.length) {
            const EPSG3857_x = coordinates[i][0];
            const EPSG3857_y = coordinates[i][1];
            const latlng = L.CRS.EPSG3857.unproject(new L.Point(EPSG3857_x, EPSG3857_y));
            coordinatesAnWayLatLng.push(latlng);
            i++;
        }
        // for (var i = 0; i < coortinates2.length; i++ ) {
        //     const EPSG3857_x = coortinates2[i][0];
        //     const EPSG3857_y = coortinates2[i][1];
        //     const latlng = L.CRS.EPSG3857.unproject(new L.Point(EPSG3857_x, EPSG3857_y));
        //     coordinatesLatLng.push(latlng);
        // }
        // console.log("New view: " + coordinatesLatLng);

        // console.log(this.state.markers_coords)
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

        {/* <Polyline positions={coordinatesOneWayLatLng} color="green" weight={4}/>
        <Polyline positions={coordinatesAnWayLatLng} weight={2}/> */}

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
