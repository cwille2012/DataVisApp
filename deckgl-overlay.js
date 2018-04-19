import React, { Component } from 'react';
import DeckGL, { HexagonLayer } from 'deck.gl';
import DeckGL, { ScatterplotLayer } from 'deck.gl';
import DeckGL, { GeoJsonLayer } from 'deck.gl';
import DeckGL, { LineLayer } from 'deck.gl';


const LIGHT_SETTINGS = {
    lightsPosition: [-0.144528, 49.739968, 8000, -3.807751, 54.104682, 8000],
    ambientRatio: 0.4,
    diffuseRatio: 0.6,
    specularRatio: 0.2,
    lightsStrength: [0.8, 0.0, 0.8, 0.0],
    numberOfLights: 2
};

const colorRange = [
    [1, 152, 189],
    [73, 227, 206],
    [216, 254, 181],
    [254, 237, 177],
    [254, 173, 84],
    [209, 55, 78]
];

const elevationScale = { min: 1, max: 3 };

const defaultProps = {
    radius: 20,
    upperPercentile: 100,
    coverage: 1
};

export default class DeckGLOverlay extends Component {
    static get defaultColorRange() {
        return colorRange;
    }

    static get defaultViewport() {
        return {
            longitude: -80.6081,
            latitude: 28.0836,
            zoom: 13,
            minZoom: 3,
            maxZoom: 15,
            pitch: 40.5,
            bearing: 0
        };
    }

    constructor(props) {
        super(props);
        this.startAnimationTimer = null;
        this.intervalTimer = null;
        this.state = {
            elevationScale: elevationScale.min
        };

        this._startAnimate = this._startAnimate.bind(this);
        this._animateHeight = this._animateHeight.bind(this);
    }

    componentDidMount() {
        this._animate();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.data.length !== this.props.data.length) {
            this._animate();
        }
    }

    componentWillUnmount() {
        this._stopAnimate();
    }

    _animate() {
        this._stopAnimate();

        // wait 1.5 secs to start animation so that all data are loaded
        this.startAnimationTimer = window.setTimeout(this._startAnimate, 1500);
    }

    _startAnimate() {
        this.intervalTimer = window.setInterval(this._animateHeight, 20);
    }

    _stopAnimate() {
        window.clearTimeout(this.startAnimationTimer);
        window.clearTimeout(this.intervalTimer);
    }

    _animateHeight() {
        if (this.state.elevationScale === elevationScale.max) {
            this._stopAnimate();
        } else {
            this.setState({ elevationScale: this.state.elevationScale + 1 });
        }
    }

    render() {
        const { viewport, data, radius, coverage, upperPercentile, polydata } = this.props;

        if (!data) {
            return null;
        }

        const layers = [
            new HexagonLayer({
                id: 'heatmap',
                colorRange,
                coverage,
                data,
                elevationRange: [1, 1000],
                elevationScale: this.state.elevationScale,
                extruded: true,
                getPosition: d => d,
                lightSettings: LIGHT_SETTINGS,
                onHover: this.props.onHover,
                opacity: 1,
                pickable: Boolean(this.props.onHover),
                radius,
                upperPercentile
            }),
            // new ScatterplotLayer({
            //     id: 'scatterplot-layer',
            //     data: [
            //         { position: [-80.5656, 28.0895], radius: 5, color: [0, 255, 0] },
            //         { position: [28.0895, -80.5656], radius: 5, color: [0, 255, 0] }
            //     ],
            //     radiusScale: 100,
            // }),
            // new LineLayer({
            //     id: 'flight-paths',
            //     data: flightdata,
            //     strokeWidth,
            //     fp64: false,
            //     getSourcePosition: d => d.start,
            //     getTargetPosition: d => d.end,
            //     getColor,
            //     pickable: Boolean(this.props.onHover),
            //     onHover: this.props.onHover
            // })
            new GeoJsonLayer({
                id: 'geojson',
                data: polydata,
                opacity: 1,
                stroked: false,
                filled: true,
                extruded: true,
                wireframe: true,
                fp64: true,
                getElevation: f => 0,
                getFillColor: f => {
                    if (f.properties.type == "positive") {
                        return [0, 0, 255]
                    } else if (f.properties.type == "neutral") {
                        return [255, 255, 255]
                    } else {
                        return [255, 0, 0]
                    }
                },
                getLineColor: f => [255, 255, 255],
                lightSettings: LIGHT_SETTINGS,
                pickable: Boolean(this.props.onHover),
                onHover: this.props.onHover
            })
        ];

        return <DeckGL {...viewport }
        layers = { layers }
        />;
    }
}

DeckGLOverlay.displayName = 'DeckGLOverlay';
DeckGLOverlay.defaultProps = defaultProps;