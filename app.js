/* global window,document */
import React, { Component } from 'react';
import { render } from 'react-dom';
import MapGL from 'react-map-gl';
import DeckGLOverlay from './deckgl-overlay.js';

import { csv as requestCsv } from 'd3-request';

//const serverURL = 'http://localhost';
//const serverPORT = 9600;
const serverURL = 'http://ec2-13-59-202-52.us-east-2.compute.amazonaws.com';
const serverPORT = 3000;

const MAPBOX_TOKEN = 'pk.eyJ1IjoiY3dpbGxlMjAxMiIsImEiOiJjajJxdWJyeXEwMDE5MzNydXF2cm1sbDU1In0.kCKIz6Ivh3EfNOmEfTANOA';

class Root extends Component {
    constructor(props) {
        super(props);
        this.state = {
            viewport: {
                ...DeckGLOverlay.defaultViewport,
                width: 500,
                height: 500
            },
            data: null
        };
        var _this = this;

        function httpGetAsync(theUrl, callback) {
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = function() {
                if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
                    callback(xmlHttp.responseText);
            }
            xmlHttp.open("GET", theUrl, true);
            xmlHttp.send(null);
        }

        this._onHover = this._onHover.bind(this);

        var canPoll;

        function pollFunc(fn, timeout, interval) {
            var startTime = (new Date()).getTime();
            interval = interval || 1000,
                canPoll = true;

            (function p() {
                canPoll = ((new Date).getTime() - startTime) <= timeout;
                if (!fn() && canPoll) { // ensures the function exucutes
                    setTimeout(p, interval);
                }
            })();
        }

        pollFunc(getData, 45000, 7000);

        function getData() {
            //console.log('Updating data');
            var address = serverURL + ':' + serverPORT;
            httpGetAsync(address + '/locationdata', function(response) {
                var newData = JSON.parse(response);
                const newResponse = newData.map(d => [Number(d.long), Number(d.lat)]);
                //console.log("New dataset:");
                console.log(newResponse);
                const data = newResponse;

                _this.setState({ data });
            });
        }
    }

    componentDidMount() {
        window.addEventListener('resize', this._resize.bind(this));
        this._resize();
    }

    _resize() {
        this._onViewportChange({
            width: window.innerWidth,
            height: window.innerHeight
        });
    }

    _onViewportChange(viewport) {
        this.setState({
            viewport: {...this.state.viewport, ...viewport }
        });
    }

    _onHover({ x, y, object }) {
        this.setState({ x, y, hoveredObject: object });
    }

    _onMouseMove(evt) {
        if (evt.nativeEvent) {
            this.setState({ mousePosition: [evt.nativeEvent.offsetX, evt.nativeEvent.offsetY] });
        }
    }

    _onMouseEnter() {
        this.setState({ mouseEntered: true });
    }

    _onMouseLeave() {
        this.setState({ mouseEntered: false });
    }

    _renderTooltip() {
        const { x, y, hoveredObject } = this.state;
        var myx = x + 15;
        var myy = y + 15;

        if (!hoveredObject) {
            return null;
        }

        var tooltipExists = !!document.getElementById('tooltip');

        if (tooltipExists) {
            document.getElementById('tooltip').style.position = "absolute";
            document.getElementById('tooltip').style.zIndex = 99999;
            document.getElementById('tooltip').style.color = '#fff';
            document.getElementById('tooltip').style.background = 'rgba(0, 0, 0, 0.8)';
            document.getElementById('tooltip').style.padding = '4px';
            document.getElementById('tooltip').style.fontSize = '18px';
            document.getElementById('tooltip').style.maxWidth = '300px';
            document.getElementById('tooltip').style.left = myx + 'px';
            document.getElementById('tooltip').style.top = myy + 'px';
            document.getElementById('tooltip').style.cursor = 'pointer';
            document.getElementById('tooltip').setAttribute('text-decoration', 'none!important');
            //console.log(hoveredObject);
            //codeLatLng(hoveredObject.centroid[1], hoveredObject.centroid[0]);
        }

        return ( < div id = "tooltip"
            style = {
                { left: myx, top: myy }
            } >
            <
            div > { 'Speed: ' + hoveredObject.points.length + ' mph' } < /div> <
            div > { 'Longitude: ' + hoveredObject.centroid[0] } < /div> <
            div > { 'Latitude: ' + hoveredObject.centroid[1] } < /div> <
            div > { 'Index: ' + hoveredObject.index } < /div>  < /
            div >
        );
    }


    render() {
        const { viewport, data, iconMapping, mousePosition, mouseEntered } = this.state;

        return ( <
            div onMouseMove = { this._onMouseMove.bind(this) }
            onMouseEnter = { this._onMouseEnter.bind(this) }
            onMouseLeave = { this._onMouseLeave.bind(this) } > { this._renderTooltip() } <
            MapGL {...viewport }
            mapStyle = "mapbox://styles/mapbox/dark-v9"
            onViewportChange = { this._onViewportChange.bind(this) }
            mapboxApiAccessToken = { MAPBOX_TOKEN } >
            <
            DeckGLOverlay viewport = { viewport }
            data = { data || [] }
            mousePosition = { mousePosition }
            mouseEntered = { mouseEntered }
            onHover = { this._onHover.bind(this) }
            /> < /
            MapGL >
            <
            /div>
        );
    }
}

render( < Root / > , document.body.appendChild(document.createElement('div')));
