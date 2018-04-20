'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _core = require('../../core');

var _scatterplotLayer = require('../scatterplot-layer/scatterplot-layer');

var _scatterplotLayer2 = _interopRequireDefault(_scatterplotLayer);

var _pathLayer = require('../path-layer/path-layer');

var _pathLayer2 = _interopRequireDefault(_pathLayer);

var _solidPolygonLayer = require('../solid-polygon-layer/solid-polygon-layer');

var _solidPolygonLayer2 = _interopRequireDefault(_solidPolygonLayer);

var _geojson = require('./geojson');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

var get = _core.experimental.get;
// Use primitive layer to avoid "Composite Composite" layers for now

var defaultLineColor = [0x0, 0x0, 0x0, 0xff];
var defaultFillColor = [0x0, 0x0, 0x0, 0xff];

var defaultProps = {
  stroked: true,
  filled: true,
  extruded: false,
  wireframe: false,

  lineWidthScale: 1,
  lineWidthMinPixels: 0,
  lineWidthMaxPixels: Number.MAX_SAFE_INTEGER,
  lineJointRounded: false,
  lineMiterLimit: 4,

  elevationScale: 1,

  pointRadiusScale: 1,
  pointRadiusMinPixels: 0, //  min point radius in pixels
  pointRadiusMaxPixels: Number.MAX_SAFE_INTEGER, // max point radius in pixels

  fp64: false,

  // Line and polygon outline color
  getLineColor: function getLineColor(f) {
    return get(f, 'properties.lineColor') || defaultLineColor;
  },
  // Point and polygon fill color
  getFillColor: function getFillColor(f) {
    return get(f, 'properties.fillColor') || defaultFillColor;
  },
  // Point radius
  getRadius: function getRadius(f) {
    return get(f, 'properties.radius') || get(f, 'properties.size') || 1;
  },
  // Line and polygon outline accessors
  getLineWidth: function getLineWidth(f) {
    return get(f, 'properties.lineWidth') || 1;
  },
  // Polygon extrusion accessor
  getElevation: function getElevation(f) {
    return get(f, 'properties.elevation') || 1000;
  },

  subLayers: {
    PointLayer: _scatterplotLayer2.default,
    LineLayer: _pathLayer2.default,
    PolygonLayer: _solidPolygonLayer2.default
  },

  // Optional settings for 'lighting' shader module
  lightSettings: {
    lightsPosition: [-122.45, 37.75, 8000, -122.0, 38.0, 5000],
    ambientRatio: 0.05,
    diffuseRatio: 0.6,
    specularRatio: 0.8,
    lightsStrength: [2.0, 0.0, 0.0, 0.0],
    numberOfLights: 2
  }
};

var getCoordinates = function getCoordinates(f) {
  return get(f, 'geometry.coordinates');
};

var GeoJsonLayer = function (_CompositeLayer) {
  _inherits(GeoJsonLayer, _CompositeLayer);

  function GeoJsonLayer() {
    _classCallCheck(this, GeoJsonLayer);

    return _possibleConstructorReturn(this, (GeoJsonLayer.__proto__ || Object.getPrototypeOf(GeoJsonLayer)).apply(this, arguments));
  }

  _createClass(GeoJsonLayer, [{
    key: 'initializeState',
    value: function initializeState() {
      this.state = {
        features: {}
      };
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref) {
      var oldProps = _ref.oldProps,
          props = _ref.props,
          changeFlags = _ref.changeFlags;

      if (changeFlags.dataChanged) {
        var data = this.props.data;

        var features = (0, _geojson.getGeojsonFeatures)(data);
        this.state.features = (0, _geojson.separateGeojsonFeatures)(features);
      }
    }
  }, {
    key: 'getPickingInfo',
    value: function getPickingInfo(_ref2) {
      var info = _ref2.info;

      return Object.assign(info, {
        // override object with picked feature
        object: info.object && info.object.feature || info.object
      });
    }

    /* eslint-disable complexity */

  }, {
    key: 'renderLayers',
    value: function renderLayers() {
      var features = this.state.features;
      var pointFeatures = features.pointFeatures,
          lineFeatures = features.lineFeatures,
          polygonFeatures = features.polygonFeatures,
          polygonOutlineFeatures = features.polygonOutlineFeatures;

      // Layer composition props

      var _props = this.props,
          stroked = _props.stroked,
          filled = _props.filled,
          extruded = _props.extruded,
          wireframe = _props.wireframe,
          subLayers = _props.subLayers,
          lightSettings = _props.lightSettings;

      // Rendering props underlying layer

      var _props2 = this.props,
          lineWidthScale = _props2.lineWidthScale,
          lineWidthMinPixels = _props2.lineWidthMinPixels,
          lineWidthMaxPixels = _props2.lineWidthMaxPixels,
          lineJointRounded = _props2.lineJointRounded,
          lineMiterLimit = _props2.lineMiterLimit,
          pointRadiusScale = _props2.pointRadiusScale,
          pointRadiusMinPixels = _props2.pointRadiusMinPixels,
          pointRadiusMaxPixels = _props2.pointRadiusMaxPixels,
          elevationScale = _props2.elevationScale,
          fp64 = _props2.fp64;

      // Accessor props for underlying layers

      var _props3 = this.props,
          getLineColor = _props3.getLineColor,
          getFillColor = _props3.getFillColor,
          getRadius = _props3.getRadius,
          getLineWidth = _props3.getLineWidth,
          getElevation = _props3.getElevation,
          updateTriggers = _props3.updateTriggers;


      var drawPoints = pointFeatures && pointFeatures.length > 0;
      var drawLines = lineFeatures && lineFeatures.length > 0;
      var hasPolygonLines = polygonOutlineFeatures && polygonOutlineFeatures.length > 0;
      var hasPolygon = polygonFeatures && polygonFeatures.length > 0;

      // Filled Polygon Layer
      var polygonFillLayer = filled && hasPolygon && new subLayers.PolygonLayer(this.getSubLayerProps({
        id: 'polygon-fill',
        updateTriggers: {
          getElevation: updateTriggers.getElevation,
          getColor: updateTriggers.getFillColor
        }
      }), {
        data: polygonFeatures,
        fp64: fp64,
        extruded: extruded,
        elevationScale: elevationScale,
        wireframe: false,
        lightSettings: lightSettings,
        getPolygon: getCoordinates,
        getElevation: getElevation,
        getColor: getFillColor
      });

      var polygonWireframeLayer = wireframe && extruded && hasPolygon && new subLayers.PolygonLayer(this.getSubLayerProps({
        id: 'polygon-wireframe',
        updateTriggers: {
          getElevation: updateTriggers.getElevation,
          getColor: updateTriggers.getLineColor
        }
      }), {
        data: polygonFeatures,

        fp64: fp64,
        extruded: extruded,
        elevationScale: elevationScale,
        wireframe: true,
        getPolygon: getCoordinates,
        getElevation: getElevation,
        getColor: getLineColor
      });

      var polygonLineLayer = !extruded && stroked && hasPolygonLines && new subLayers.LineLayer(this.getSubLayerProps({
        id: 'polygon-outline',
        updateTriggers: {
          getColor: updateTriggers.getLineColor,
          getWidth: updateTriggers.getLineWidth
        }
      }), {
        data: polygonOutlineFeatures,

        fp64: fp64,
        widthScale: lineWidthScale,
        widthMinPixels: lineWidthMinPixels,
        widthMaxPixels: lineWidthMaxPixels,
        rounded: lineJointRounded,
        miterLimit: lineMiterLimit,

        getPath: getCoordinates,
        getColor: getLineColor,
        getWidth: getLineWidth
      });

      var pathLayer = drawLines && new subLayers.LineLayer(this.getSubLayerProps({
        id: 'line-paths',
        updateTriggers: {
          getColor: updateTriggers.getLineColor,
          getWidth: updateTriggers.getLineWidth
        }
      }), {
        data: lineFeatures,

        fp64: fp64,
        widthScale: lineWidthScale,
        widthMinPixels: lineWidthMinPixels,
        widthMaxPixels: lineWidthMaxPixels,
        rounded: lineJointRounded,
        miterLimit: lineMiterLimit,

        getPath: getCoordinates,
        getColor: getLineColor,
        getWidth: getLineWidth
      });

      var pointLayer = drawPoints && new subLayers.PointLayer(this.getSubLayerProps({
        id: 'points',
        updateTriggers: {
          getColor: updateTriggers.getFillColor,
          getRadius: updateTriggers.getRadius
        }
      }), {
        data: pointFeatures,

        fp64: fp64,
        radiusScale: pointRadiusScale,
        radiusMinPixels: pointRadiusMinPixels,
        radiusMaxPixels: pointRadiusMaxPixels,

        getPosition: getCoordinates,
        getColor: getFillColor,
        getRadius: getRadius
      });

      return [
      // If not extruded: flat fill layer is drawn below outlines
      !extruded && polygonFillLayer, polygonWireframeLayer, polygonLineLayer, pathLayer, pointLayer,
      // If extruded: draw fill layer last for correct blending behavior
      extruded && polygonFillLayer];
    }
    /* eslint-enable complexity */

  }]);

  return GeoJsonLayer;
}(_core.CompositeLayer);

exports.default = GeoJsonLayer;


GeoJsonLayer.layerName = 'GeoJsonLayer';
GeoJsonLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlLWxheWVycy9nZW9qc29uLWxheWVyL2dlb2pzb24tbGF5ZXIuanMiXSwibmFtZXMiOlsiZ2V0IiwiZGVmYXVsdExpbmVDb2xvciIsImRlZmF1bHRGaWxsQ29sb3IiLCJkZWZhdWx0UHJvcHMiLCJzdHJva2VkIiwiZmlsbGVkIiwiZXh0cnVkZWQiLCJ3aXJlZnJhbWUiLCJsaW5lV2lkdGhTY2FsZSIsImxpbmVXaWR0aE1pblBpeGVscyIsImxpbmVXaWR0aE1heFBpeGVscyIsIk51bWJlciIsIk1BWF9TQUZFX0lOVEVHRVIiLCJsaW5lSm9pbnRSb3VuZGVkIiwibGluZU1pdGVyTGltaXQiLCJlbGV2YXRpb25TY2FsZSIsInBvaW50UmFkaXVzU2NhbGUiLCJwb2ludFJhZGl1c01pblBpeGVscyIsInBvaW50UmFkaXVzTWF4UGl4ZWxzIiwiZnA2NCIsImdldExpbmVDb2xvciIsImYiLCJnZXRGaWxsQ29sb3IiLCJnZXRSYWRpdXMiLCJnZXRMaW5lV2lkdGgiLCJnZXRFbGV2YXRpb24iLCJzdWJMYXllcnMiLCJQb2ludExheWVyIiwiTGluZUxheWVyIiwiUG9seWdvbkxheWVyIiwibGlnaHRTZXR0aW5ncyIsImxpZ2h0c1Bvc2l0aW9uIiwiYW1iaWVudFJhdGlvIiwiZGlmZnVzZVJhdGlvIiwic3BlY3VsYXJSYXRpbyIsImxpZ2h0c1N0cmVuZ3RoIiwibnVtYmVyT2ZMaWdodHMiLCJnZXRDb29yZGluYXRlcyIsIkdlb0pzb25MYXllciIsInN0YXRlIiwiZmVhdHVyZXMiLCJvbGRQcm9wcyIsInByb3BzIiwiY2hhbmdlRmxhZ3MiLCJkYXRhQ2hhbmdlZCIsImRhdGEiLCJpbmZvIiwiT2JqZWN0IiwiYXNzaWduIiwib2JqZWN0IiwiZmVhdHVyZSIsInBvaW50RmVhdHVyZXMiLCJsaW5lRmVhdHVyZXMiLCJwb2x5Z29uRmVhdHVyZXMiLCJwb2x5Z29uT3V0bGluZUZlYXR1cmVzIiwidXBkYXRlVHJpZ2dlcnMiLCJkcmF3UG9pbnRzIiwibGVuZ3RoIiwiZHJhd0xpbmVzIiwiaGFzUG9seWdvbkxpbmVzIiwiaGFzUG9seWdvbiIsInBvbHlnb25GaWxsTGF5ZXIiLCJnZXRTdWJMYXllclByb3BzIiwiaWQiLCJnZXRDb2xvciIsImdldFBvbHlnb24iLCJwb2x5Z29uV2lyZWZyYW1lTGF5ZXIiLCJwb2x5Z29uTGluZUxheWVyIiwiZ2V0V2lkdGgiLCJ3aWR0aFNjYWxlIiwid2lkdGhNaW5QaXhlbHMiLCJ3aWR0aE1heFBpeGVscyIsInJvdW5kZWQiLCJtaXRlckxpbWl0IiwiZ2V0UGF0aCIsInBhdGhMYXllciIsInBvaW50TGF5ZXIiLCJyYWRpdXNTY2FsZSIsInJhZGl1c01pblBpeGVscyIsInJhZGl1c01heFBpeGVscyIsImdldFBvc2l0aW9uIiwibGF5ZXJOYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQW9CQTs7QUFFQTs7OztBQUNBOzs7O0FBRUE7Ozs7QUFFQTs7Ozs7Ozs7K2VBM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztJQUdPQSxHLHNCQUFBQSxHO0FBR1A7O0FBS0EsSUFBTUMsbUJBQW1CLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLEVBQWdCLElBQWhCLENBQXpCO0FBQ0EsSUFBTUMsbUJBQW1CLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLEVBQWdCLElBQWhCLENBQXpCOztBQUVBLElBQU1DLGVBQWU7QUFDbkJDLFdBQVMsSUFEVTtBQUVuQkMsVUFBUSxJQUZXO0FBR25CQyxZQUFVLEtBSFM7QUFJbkJDLGFBQVcsS0FKUTs7QUFNbkJDLGtCQUFnQixDQU5HO0FBT25CQyxzQkFBb0IsQ0FQRDtBQVFuQkMsc0JBQW9CQyxPQUFPQyxnQkFSUjtBQVNuQkMsb0JBQWtCLEtBVEM7QUFVbkJDLGtCQUFnQixDQVZHOztBQVluQkMsa0JBQWdCLENBWkc7O0FBY25CQyxvQkFBa0IsQ0FkQztB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QU1MQyxVQU5LO0FBT0w7QUFDQXRFLGtCQUFZdUQsZ0JBUlAsQ0FBUDtBQVVEO0FBQ0Q7Ozs7Ozs7a0JBdE1tQnZCLFk7OztBQXlNckJBLGFBQWEyQyxTQUFiLEdBQXlCLGNBQXpCO0FBQ0EzQyxhQUFhbkMsWUFBYixHQUE0QkEsWUFBNUIiLCJmaWxlIjoiZ2VvanNvbi1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSAtIDIwMTcgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQge0NvbXBvc2l0ZUxheWVyLCBleHBlcmltZW50YWx9IGZyb20gJy4uLy4uL2NvcmUnO1xuY29uc3Qge2dldH0gPSBleHBlcmltZW50YWw7XG5pbXBvcnQgU2NhdHRlcnBsb3RMYXllciBmcm9tICcuLi9zY2F0dGVycGxvdC1sYXllci9zY2F0dGVycGxvdC1sYXllcic7XG5pbXBvcnQgUGF0aExheWVyIGZyb20gJy4uL3BhdGgtbGF5ZXIvcGF0aC1sYXllcic7XG4vLyBVc2UgcHJpbWl0aXZlIGxheWVyIHRvIGF2b2lkIFwiQ29tcG9zaXRlIENvbXBvc2l0ZVwiIGxheWVycyBmb3Igbm93XG5pbXBvcnQgU29saWRQb2x5Z29uTGF5ZXIgZnJvbSAnLi4vc29saWQtcG9seWdvbi1sYXllci9zb2xpZC1wb2x5Z29uLWxheWVyJztcblxuaW1wb3J0IHtnZXRHZW9qc29uRmVhdHVyZXMsIHNlcGFyYXRlR2VvanNvbkZlYXR1cmVzfSBmcm9tICcuL2dlb2pzb24nO1xuXG5jb25zdCBkZWZhdWx0TGluZUNvbG9yID0gWzB4MCwgMHgwLCAweDAsIDB4ZmZdO1xuY29uc3QgZGVmYXVsdEZpbGxDb2xvciA9IFsweDAsIDB4MCwgMHgwLCAweGZmXTtcblxuY29uc3QgZGVmYXVsdFByb3BzID0ge1xuICBzdHJva2VkOiB0cnVlLFxuICBmaWxsZWQ6IHRydWUsXG4gIGV4dHJ1ZGVkOiBmYWxzZSxcbiAgd2lyZWZyYW1lOiBmYWxzZSxcblxuICBsaW5lV2lkdGhTY2FsZTogMSxcbiAgbGluZVdpZHRoTWluUGl4ZWxzOiAwLFxuICBsaW5lV2lkdGhNYXhQaXhlbHM6IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSLFxuICBsaW5lSm9pbnRSb3VuZGVkOiBmYWxzZSxcbiAgbGluZU1pdGVyTGltaXQ6IDQsXG5cbiAgZWxldmF0aW9uU2NhbGU6IDEsXG5cbiAgcG9pbnRSYWRpdXNTY2FsZTogMSxcbiAgcG9pbnRSYWRpdXNNaW5QaXhlbHM6IDAsIC8vICBtaW4gcG9pbnQgcmFkaXVzIGluIHBpeGVsc1xuICBwb2ludFJhZGl1c01heFBpeGVsczogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIsIC8vIG1heCBwb2ludCByYWRpdXMgaW4gcGl4ZWxzXG5cbiAgZnA2NDogZmFsc2UsXG5cbiAgLy8gTGluZSBhbmQgcG9seWdvbiBvdXRsaW5lIGNvbG9yXG4gIGdldExpbmVDb2xvcjogZiA9PiBnZXQoZiwgJ3Byb3BlcnRpZXMubGluZUNvbG9yJykgfHwgZGVmYXVsdExpbmVDb2xvcixcbiAgLy8gUG9pbnQgYW5kIHBvbHlnb24gZmlsbCBjb2xvclxuICBnZXRGaWxsQ29sb3I6IGYgPT4gZ2V0KGYsICdwcm9wZXJ0aWVzLmZpbGxDb2xvcicpIHx8IGRlZmF1bHRGaWxsQ29sb3IsXG4gIC8vIFBvaW50IHJhZGl1c1xuICBnZXRSYWRpdXM6IGYgPT4gZ2V0KGYsICdwcm9wZXJ0aWVzLnJhZGl1cycpIHx8IGdldChmLCAncHJvcGVydGllcy5zaXplJykgfHwgMSxcbiAgLy8gTGluZSBhbmQgcG9seWdvbiBvdXRsaW5lIGFjY2Vzc29yc1xuICBnZXRMaW5lV2lkdGg6IGYgPT4gZ2V0KGYsICdwcm9wZXJ0aWVzLmxpbmVXaWR0aCcpIHx8IDEsXG4gIC8vIFBvbHlnb24gZXh0cnVzaW9uIGFjY2Vzc29yXG4gIGdldEVsZXZhdGlvbjogZiA9PiBnZXQoZiwgJ3Byb3BlcnRpZXMuZWxldmF0aW9uJykgfHwgMTAwMCxcblxuICBzdWJMYXllcnM6IHtcbiAgICBQb2ludExheWVyOiBTY2F0dGVycGxvdExheWVyLFxuICAgIExpbmVMYXllcjogUGF0aExheWVyLFxuICAgIFBvbHlnb25MYXllcjogU29saWRQb2x5Z29uTGF5ZXJcbiAgfSxcblxuICAvLyBPcHRpb25hbCBzZXR0aW5ncyBmb3IgJ2xpZ2h0aW5nJyBzaGFkZXIgbW9kdWxlXG4gIGxpZ2h0U2V0dGluZ3M6IHtcbiAgICBsaWdodHNQb3NpdGlvbjogWy0xMjIuNDUsIDM3Ljc1LCA4MDAwLCAtMTIyLjAsIDM4LjAsIDUwMDBdLFxuICAgIGFtYmllbnRSYXRpbzogMC4wNSxcbiAgICBkaWZmdXNlUmF0aW86IDAuNixcbiAgICBzcGVjdWxhclJhdGlvOiAwLjgsXG4gICAgbGlnaHRzU3RyZW5ndGg6IFsyLjAsIDAuMCwgMC4wLCAwLjBdLFxuICAgIG51bWJlck9mTGlnaHRzOiAyXG4gIH1cbn07XG5cbmNvbnN0IGdldENvb3JkaW5hdGVzID0gZiA9PiBnZXQoZiwgJ2dlb21ldHJ5LmNvb3JkaW5hdGVzJyk7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdlb0pzb25MYXllciBleHRlbmRzIENvbXBvc2l0ZUxheWVyIHtcbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBmZWF0dXJlczoge31cbiAgICB9O1xuICB9XG5cbiAgdXBkYXRlU3RhdGUoe29sZFByb3BzLCBwcm9wcywgY2hhbmdlRmxhZ3N9KSB7XG4gICAgaWYgKGNoYW5nZUZsYWdzLmRhdGFDaGFuZ2VkKSB7XG4gICAgICBjb25zdCB7ZGF0YX0gPSB0aGlzLnByb3BzO1xuICAgICAgY29uc3QgZmVhdHVyZXMgPSBnZXRHZW9qc29uRmVhdHVyZXMoZGF0YSk7XG4gICAgICB0aGlzLnN0YXRlLmZlYXR1cmVzID0gc2VwYXJhdGVHZW9qc29uRmVhdHVyZXMoZmVhdHVyZXMpO1xuICAgIH1cbiAgfVxuXG4gIGdldFBpY2tpbmdJbmZvKHtpbmZvfSkge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKGluZm8sIHtcbiAgICAgIC8vIG92ZXJyaWRlIG9iamVjdCB3aXRoIHBpY2tlZCBmZWF0dXJlXG4gICAgICBvYmplY3Q6IChpbmZvLm9iamVjdCAmJiBpbmZvLm9iamVjdC5mZWF0dXJlKSB8fCBpbmZvLm9iamVjdFxuICAgIH0pO1xuICB9XG5cbiAgLyogZXNsaW50LWRpc2FibGUgY29tcGxleGl0eSAqL1xuICByZW5kZXJMYXllcnMoKSB7XG4gICAgY29uc3Qge2ZlYXR1cmVzfSA9IHRoaXMuc3RhdGU7XG4gICAgY29uc3Qge3BvaW50RmVhdHVyZXMsIGxpbmVGZWF0dXJlcywgcG9seWdvbkZlYXR1cmVzLCBwb2x5Z29uT3V0bGluZUZlYXR1cmVzfSA9IGZlYXR1cmVzO1xuXG4gICAgLy8gTGF5ZXIgY29tcG9zaXRpb24gcHJvcHNcbiAgICBjb25zdCB7c3Ryb2tlZCwgZmlsbGVkLCBleHRydWRlZCwgd2lyZWZyYW1lLCBzdWJMYXllcnMsIGxpZ2h0U2V0dGluZ3N9ID0gdGhpcy5wcm9wcztcblxuICAgIC8vIFJlbmRlcmluZyBwcm9wcyB1bmRlcmx5aW5nIGxheWVyXG4gICAgY29uc3Qge1xuICAgICAgbGluZVdpZHRoU2NhbGUsXG4gICAgICBsaW5lV2lkdGhNaW5QaXhlbHMsXG4gICAgICBsaW5lV2lkdGhNYXhQaXhlbHMsXG4gICAgICBsaW5lSm9pbnRSb3VuZGVkLFxuICAgICAgbGluZU1pdGVyTGltaXQsXG4gICAgICBwb2ludFJhZGl1c1NjYWxlLFxuICAgICAgcG9pbnRSYWRpdXNNaW5QaXhlbHMsXG4gICAgICBwb2ludFJhZGl1c01heFBpeGVscyxcbiAgICAgIGVsZXZhdGlvblNjYWxlLFxuICAgICAgZnA2NFxuICAgIH0gPSB0aGlzLnByb3BzO1xuXG4gICAgLy8gQWNjZXNzb3IgcHJvcHMgZm9yIHVuZGVybHlpbmcgbGF5ZXJzXG4gICAgY29uc3Qge1xuICAgICAgZ2V0TGluZUNvbG9yLFxuICAgICAgZ2V0RmlsbENvbG9yLFxuICAgICAgZ2V0UmFkaXVzLFxuICAgICAgZ2V0TGluZVdpZHRoLFxuICAgICAgZ2V0RWxldmF0aW9uLFxuICAgICAgdXBkYXRlVHJpZ2dlcnNcbiAgICB9ID0gdGhpcy5wcm9wcztcblxuICAgIGNvbnN0IGRyYXdQb2ludHMgPSBwb2ludEZlYXR1cmVzICYmIHBvaW50RmVhdHVyZXMubGVuZ3RoID4gMDtcbiAgICBjb25zdCBkcmF3TGluZXMgPSBsaW5lRmVhdHVyZXMgJiYgbGluZUZlYXR1cmVzLmxlbmd0aCA+IDA7XG4gICAgY29uc3QgaGFzUG9seWdvbkxpbmVzID0gcG9seWdvbk91dGxpbmVGZWF0dXJlcyAmJiBwb2x5Z29uT3V0bGluZUZlYXR1cmVzLmxlbmd0aCA+IDA7XG4gICAgY29uc3QgaGFzUG9seWdvbiA9IHBvbHlnb25GZWF0dXJlcyAmJiBwb2x5Z29uRmVhdHVyZXMubGVuZ3RoID4gMDtcblxuICAgIC8vIEZpbGxlZCBQb2x5Z29uIExheWVyXG4gICAgY29uc3QgcG9seWdvbkZpbGxMYXllciA9XG4gICAgICBmaWxsZWQgJiZcbiAgICAgIGhhc1BvbHlnb24gJiZcbiAgICAgIG5ldyBzdWJMYXllcnMuUG9seWdvbkxheWVyKFxuICAgICAgICB0aGlzLmdldFN1YkxheWVyUHJvcHMoe1xuICAgICAgICAgIGlkOiAncG9seWdvbi1maWxsJyxcbiAgICAgICAgICB1cGRhdGVUcmlnZ2Vyczoge1xuICAgICAgICAgICAgZ2V0RWxldmF0aW9uOiB1cGRhdGVUcmlnZ2Vycy5nZXRFbGV2YXRpb24sXG4gICAgICAgICAgICBnZXRDb2xvcjogdXBkYXRlVHJpZ2dlcnMuZ2V0RmlsbENvbG9yXG4gICAgICAgICAgfVxuICAgICAgICB9KSxcbiAgICAgICAge1xuICAgICAgICAgIGRhdGE6IHBvbHlnb25GZWF0dXJlcyxcbiAgICAgICAgICBmcDY0LFxuICAgICAgICAgIGV4dHJ1ZGVkLFxuICAgICAgICAgIGVsZXZhdGlvblNjYWxlLFxuICAgICAgICAgIHdpcmVmcmFtZTogZmFsc2UsXG4gICAgICAgICAgbGlnaHRTZXR0aW5ncyxcbiAgICAgICAgICBnZXRQb2x5Z29uOiBnZXRDb29yZGluYXRlcyxcbiAgICAgICAgICBnZXRFbGV2YXRpb24sXG4gICAgICAgICAgZ2V0Q29sb3I6IGdldEZpbGxDb2xvclxuICAgICAgICB9XG4gICAgICApO1xuXG4gICAgY29uc3QgcG9seWdvbldpcmVmcmFtZUxheWVyID1cbiAgICAgIHdpcmVmcmFtZSAmJlxuICAgICAgZXh0cnVkZWQgJiZcbiAgICAgIGhhc1BvbHlnb24gJiZcbiAgICAgIG5ldyBzdWJMYXllcnMuUG9seWdvbkxheWVyKFxuICAgICAgICB0aGlzLmdldFN1YkxheWVyUHJvcHMoe1xuICAgICAgICAgIGlkOiAncG9seWdvbi13aXJlZnJhbWUnLFxuICAgICAgICAgIHVwZGF0ZVRyaWdnZXJzOiB7XG4gICAgICAgICAgICBnZXRFbGV2YXRpb246IHVwZGF0ZVRyaWdnZXJzLmdldEVsZXZhdGlvbixcbiAgICAgICAgICAgIGdldENvbG9yOiB1cGRhdGVUcmlnZ2Vycy5nZXRMaW5lQ29sb3JcbiAgICAgICAgICB9XG4gICAgICAgIH0pLFxuICAgICAgICB7XG4gICAgICAgICAgZGF0YTogcG9seWdvbkZlYXR1cmVzLFxuXG4gICAgICAgICAgZnA2NCxcbiAgICAgICAgICBleHRydWRlZCxcbiAgICAgICAgICBlbGV2YXRpb25TY2FsZSxcbiAgICAgICAgICB3aXJlZnJhbWU6IHRydWUsXG4gICAgICAgICAgZ2V0UG9seWdvbjogZ2V0Q29vcmRpbmF0ZXMsXG4gICAgICAgICAgZ2V0RWxldmF0aW9uLFxuICAgICAgICAgIGdldENvbG9yOiBnZXRMaW5lQ29sb3JcbiAgICAgICAgfVxuICAgICAgKTtcblxuICAgIGNvbnN0IHBvbHlnb25MaW5lTGF5ZXIgPVxuICAgICAgIWV4dHJ1ZGVkICYmXG4gICAgICBzdHJva2VkICYmXG4gICAgICBoYXNQb2x5Z29uTGluZXMgJiZcbiAgICAgIG5ldyBzdWJMYXllcnMuTGluZUxheWVyKFxuICAgICAgICB0aGlzLmdldFN1YkxheWVyUHJvcHMoe1xuICAgICAgICAgIGlkOiAncG9seWdvbi1vdXRsaW5lJyxcbiAgICAgICAgICB1cGRhdGVUcmlnZ2Vyczoge1xuICAgICAgICAgICAgZ2V0Q29sb3I6IHVwZGF0ZVRyaWdnZXJzLmdldExpbmVDb2xvcixcbiAgICAgICAgICAgIGdldFdpZHRoOiB1cGRhdGVUcmlnZ2Vycy5nZXRMaW5lV2lkdGhcbiAgICAgICAgICB9XG4gICAgICAgIH0pLFxuICAgICAgICB7XG4gICAgICAgICAgZGF0YTogcG9seWdvbk91dGxpbmVGZWF0dXJlcyxcblxuICAgICAgICAgIGZwNjQsXG4gICAgICAgICAgd2lkdGhTY2FsZTogbGluZVdpZHRoU2NhbGUsXG4gICAgICAgICAgd2lkdGhNaW5QaXhlbHM6IGxpbmVXaWR0aE1pblBpeGVscyxcbiAgICAgICAgICB3aWR0aE1heFBpeGVsczogbGluZVdpZHRoTWF4UGl4ZWxzLFxuICAgICAgICAgIHJvdW5kZWQ6IGxpbmVKb2ludFJvdW5kZWQsXG4gICAgICAgICAgbWl0ZXJMaW1pdDogbGluZU1pdGVyTGltaXQsXG5cbiAgICAgICAgICBnZXRQYXRoOiBnZXRDb29yZGluYXRlcyxcbiAgICAgICAgICBnZXRDb2xvcjogZ2V0TGluZUNvbG9yLFxuICAgICAgICAgIGdldFdpZHRoOiBnZXRMaW5lV2lkdGhcbiAgICAgICAgfVxuICAgICAgKTtcblxuICAgIGNvbnN0IHBhdGhMYXllciA9XG4gICAgICBkcmF3TGluZXMgJiZcbiAgICAgIG5ldyBzdWJMYXllcnMuTGluZUxheWVyKFxuICAgICAgICB0aGlzLmdldFN1YkxheWVyUHJvcHMoe1xuICAgICAgICAgIGlkOiAnbGluZS1wYXRocycsXG4gICAgICAgICAgdXBkYXRlVHJpZ2dlcnM6IHtcbiAgICAgICAgICAgIGdldENvbG9yOiB1cGRhdGVUcmlnZ2Vycy5nZXRMaW5lQ29sb3IsXG4gICAgICAgICAgICBnZXRXaWR0aDogdXBkYXRlVHJpZ2dlcnMuZ2V0TGluZVdpZHRoXG4gICAgICAgICAgfVxuICAgICAgICB9KSxcbiAgICAgICAge1xuICAgICAgICAgIGRhdGE6IGxpbmVGZWF0dXJlcyxcblxuICAgICAgICAgIGZwNjQsXG4gICAgICAgICAgd2lkdGhTY2FsZTogbGluZVdpZHRoU2NhbGUsXG4gICAgICAgICAgd2lkdGhNaW5QaXhlbHM6IGxpbmVXaWR0aE1pblBpeGVscyxcbiAgICAgICAgICB3aWR0aE1heFBpeGVsczogbGluZVdpZHRoTWF4UGl4ZWxzLFxuICAgICAgICAgIHJvdW5kZWQ6IGxpbmVKb2ludFJvdW5kZWQsXG4gICAgICAgICAgbWl0ZXJMaW1pdDogbGluZU1pdGVyTGltaXQsXG5cbiAgICAgICAgICBnZXRQYXRoOiBnZXRDb29yZGluYXRlcyxcbiAgICAgICAgICBnZXRDb2xvcjogZ2V0TGluZUNvbG9yLFxuICAgICAgICAgIGdldFdpZHRoOiBnZXRMaW5lV2lkdGhcbiAgICAgICAgfVxuICAgICAgKTtcblxuICAgIGNvbnN0IHBvaW50TGF5ZXIgPVxuICAgICAgZHJhd1BvaW50cyAmJlxuICAgICAgbmV3IHN1YkxheWVycy5Qb2ludExheWVyKFxuICAgICAgICB0aGlzLmdldFN1YkxheWVyUHJvcHMoe1xuICAgICAgICAgIGlkOiAncG9pbnRzJyxcbiAgICAgICAgICB1cGRhdGVUcmlnZ2Vyczoge1xuICAgICAgICAgICAgZ2V0Q29sb3I6IHVwZGF0ZVRyaWdnZXJzLmdldEZpbGxDb2xvcixcbiAgICAgICAgICAgIGdldFJhZGl1czogdXBkYXRlVHJpZ2dlcnMuZ2V0UmFkaXVzXG4gICAgICAgICAgfVxuICAgICAgICB9KSxcbiAgICAgICAge1xuICAgICAgICAgIGRhdGE6IHBvaW50RmVhdHVyZXMsXG5cbiAgICAgICAgICBmcDY0LFxuICAgICAgICAgIHJhZGl1c1NjYWxlOiBwb2ludFJhZGl1c1NjYWxlLFxuICAgICAgICAgIHJhZGl1c01pblBpeGVsczogcG9pbnRSYWRpdXNNaW5QaXhlbHMsXG4gICAgICAgICAgcmFkaXVzTWF4UGl4ZWxzOiBwb2ludFJhZGl1c01heFBpeGVscyxcblxuICAgICAgICAgIGdldFBvc2l0aW9uOiBnZXRDb29yZGluYXRlcyxcbiAgICAgICAgICBnZXRDb2xvcjogZ2V0RmlsbENvbG9yLFxuICAgICAgICAgIGdldFJhZGl1c1xuICAgICAgICB9XG4gICAgICApO1xuXG4gICAgcmV0dXJuIFtcbiAgICAgIC8vIElmIG5vdCBleHRydWRlZDogZmxhdCBmaWxsIGxheWVyIGlzIGRyYXduIGJlbG93IG91dGxpbmVzXG4gICAgICAhZXh0cnVkZWQgJiYgcG9seWdvbkZpbGxMYXllcixcbiAgICAgIHBvbHlnb25XaXJlZnJhbWVMYXllcixcbiAgICAgIHBvbHlnb25MaW5lTGF5ZXIsXG4gICAgICBwYXRoTGF5ZXIsXG4gICAgICBwb2ludExheWVyLFxuICAgICAgLy8gSWYgZXh0cnVkZWQ6IGRyYXcgZmlsbCBsYXllciBsYXN0IGZvciBjb3JyZWN0IGJsZW5kaW5nIGJlaGF2aW9yXG4gICAgICBleHRydWRlZCAmJiBwb2x5Z29uRmlsbExheWVyXG4gICAgXTtcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIGNvbXBsZXhpdHkgKi9cbn1cblxuR2VvSnNvbkxheWVyLmxheWVyTmFtZSA9ICdHZW9Kc29uTGF5ZXInO1xuR2VvSnNvbkxheWVyLmRlZmF1bHRQcm9wcyA9IGRlZmF1bHRQcm9wcztcbiJdfQ==