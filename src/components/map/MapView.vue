<template>
	<div class="map-box">
		<div class="map-box" ref="map"></div>
		<div class="map-container selete-box" style="width: 300px; height: 45px; top: 10px">
			<MapSwitch
				ref="mapSwitch"
				:map="map"
				:mapSet="mapSet"
				v-if="map"
			/>
		</div>

		<LayerManage
			class="map-container"
			style="width: 45px; height: 45px"
			v-if="map && showLayerControl"
			:map="map"
			:layerList="layerList"
		/>
		<SelectBox
			@select-layer="onslect"
			class="map-container selete-box"
			v-if="map && showSelectControl"
			:map="map"
		/>
	</div>
</template>

<script>
import { MapService } from "./service/map";
import { LayerService } from "./service/layer";
import {
	showPoints,
	showLines,
	showPolygons,
	showClusterPoints,
	showHeatMapPoints,
	getSelectByPoint,
	getSelectByPolygon,
	showMultiPolygons,
	showMarker,
	removeMarker,
	showCircle,
	showPathPlay,
} from "./service/operationMap";
import { showDarw } from "./service/darw";
import SelectBox from "./SelectBox";
import LayerManage from "./LayerManage";
import { showInfoWindow ,closeInfoWindowById} from "./service/infoWindow";
import MapSwitch from "./map-switch/index";
import * as SMap from "@/assets/plugin/map.js";

const { Heatmap, DrawAndSelect, VerticalBounceAnimation } = SMap;
export default {
	components: {
		SelectBox,
		LayerManage,
		MapSwitch,
	},
	props: {
		visible:true,
		layerList: {
			type: Array,
			default: [],
		},
		mapSet:{
			type:Object
		},
		showLayerControl: { type: Boolean, default: true },
		showSelectControl: { type: Boolean, default: true },
	},
	data() {
		return {
			map: null,
			layerInfo: null,
			_darw: null,
		};
	},
	mounted() {
		this.initMap();
	},
	methods: {
			mapLayerList() {
			const list = this.layerInfo && this.layerInfo.layerList || {};
			return Object.values(list).filter((item) => {
				return !(item instanceof Heatmap);
			});
		},
		initMap() {
			const mapService = new MapService();
			const dom = this.$refs.map;
			this.map = mapService.initMap(dom, {
				zoom: true,
				mouse: true,
				scale: true,
				switch: true,
				control: false,
			});
			this.map.on("click", (evt) => {
				let selectLayer = [];
				this.map.forEachLayerAtPixel(
					evt.pixel,
					(layer) => {
						if (layer) {
							selectLayer.push(layer);
						}
					},
					{
						layerFilter: (layer) => {
							return !(layer instanceof Heatmap);
						},
					}
				);
				const featureLayer = [];
				if (!selectLayer.length) return;
				selectLayer.forEach((layer) => {
					this.map.forEachFeatureAtPixel(
						evt.pixel,
						function (feature, layer) {
							if (feature) {
								featureLayer.push({ layer, feature });
							}
						},
						{
							layerFilter: function (lay) {
								return lay === layer;
							},
						}
					);
				});
				for (let i = 0; i < featureLayer.length; i++) {
					const pointAnimtion = featureLayer[i].feature.values_.hasAnimtion;
					if (
						pointAnimtion !== false &&
						(pointAnimtion === true || featureLayer[i].layer.hasAnimtion)
					) {
						const animation = new VerticalBounceAnimation({
							repeat: 6,
						});
						featureLayer[i].layer.animateFeature(
							featureLayer[i].feature,
							animation
						);
					}
					const data =  featureLayer[i].feature.values_;
					try{
						if (featureLayer[i].layer.eventOnClick && (!data.data || !data.data.__point_lable__)) {
						// const data = featureLayer[i].feature.values_.features?[featureLayer[i].feature.values_]|featureLayer[i].feature.values_.features
						const v = featureLayer[i].layer.eventOnClick({
							data: { data },
							originalEvent: evt.originalEvent,
							feature: featureLayer[i].feature,
						});
						if (v === false) return;
					}
					}catch(e){}
				}
			});
			this.layerInfo = new LayerService(this.map);
			this.$emit("map-init", this);
			// this.showPoints([[113.137599, 23.031483]]);
		},
		onslect(evt) {
			this.$emit("select-layer", evt);
		},
		// 展示多组不同样式的点
		showMoerStylePoints(points, layer) {
			if (!layer) {
				throw "请传入图层,调用createLayer方法获取图层";
			}
			points.forEach((item) => {
				const { points, style } = item;
				this.showOneStylePoints(points, style, layer);
			});
		},
		showClusterPoints(points, layer) {
			showClusterPoints(layer, points);
		},
		// 展示一组
		showOneStylePoints(points, style, layer) {
			if (!layer) {
				const layerinfo = this.layerInfo.createLayer();
				layer = layerinfo.layer;
			}
			showPoints(layer, points, style,this.map);
			return layer;
		},
		showMoerStyleLines(points, layer) {
			if (!layer) {
				throw "请传入图层,调用createLayer方法获取图层";
			}
			points.forEach((item) => {
				const { lines, style } = item;
				this.showOneStyleLines(lines, style, layer);
			});
		},
		// 展示一组
		showOneStyleLines(lines, style, layer) {
			if (!layer) {
				const layerinfo = this.layerInfo.createLayer();
				layer = layerinfo.layer;
			}
			showLines(layer, lines, style);
			return layer;
		},
		showMoerStylePolygon(polygons, layer) {
			if (!layer) {
				throw "请传入图层,调用createLayer方法获取图层";
			}
			polygons.forEach((item) => {
				const { polygons, style } = item;
				this.showOneStylePolygon(polygons, style, layer);
			});
		},
		// 展示一组
		showOneStylePolygon(polygons, style, layer) {
			if (!layer) {
				const layerinfo = this.layerInfo.createLayer();
				layer = layerinfo.layer;
			}
			showPolygons(layer, polygons, style);
			return layer;
		},
		showMoerStyleMultiPolygon(polygons, layer) {
			if (!layer) {
				throw "请传入图层,调用createLayer方法获取图层";
			}
			polygons.forEach((item) => {
				const { polygons, style } = item;
				this.showOneStyleMultiPolygon(polygons, style, layer);
			});
		},
		// 展示一组
		showOneStyleMultiPolygon(polygons, style, layer) {
			if (!layer) {
				const layerinfo = this.layerInfo.createLayer();
				layer = layerinfo.layer;
			}
			showMultiPolygons(layer, polygons, style);
			return layer;
		},
		showCircle(option, style, layer) {
			if (!layer) {
				const layerinfo = this.layerInfo.createLayer();
				layer = layerinfo.layer;
			}
			showCircle(layer, option, style, this.map);
			return layer;
		},
		showInfoWindow(id, option) {
			const infowindowInfo =  showInfoWindow(id, option, this.map);
			return infowindowInfo.infoWindow;
		},
		closeInfoWindowById(id){
			closeInfoWindowById(id);
		},
		createLayer(id, callback, options) {
			const layer = this.layerInfo.createLayer(id, callback, options);
			return layer.layer;
		},
		createClusterLayer(id, option, callback) {
			const layer = this.layerInfo.createClusterLayer(id, option, callback);
			return layer.layer;
		},
		createHeatMapLayer(id, option) {
			const layer = this.layerInfo.createHeatmap(id, option);
			return layer.layer;
		},
		showHeatMapPoints(layer, points) {
			showHeatMapPoints(layer, points);
		},
		removeLayer(layer) {
			this.layerInfo.destroyLayer(layer);
		},
		clearLayer(layer) {
			layer && this.layerInfo.clearLayer(layer);
		},
		setVisible(layer, visible) {
			this.layerInfo.setVisible(layer, visible);
		},
		getSelectByPoint(point, width) {
			return getSelectByPoint(this.mapLayerList(), point, width);
		},
		getSelectByPolygon(data) {
			return getSelectByPolygon(this.mapLayerList(), data);
		},
		getCreateGeometryData(val, callback) {
			showDarw.createDarw(this.map, [], val, callback, true);
		},
		showMarker(point, option, textOption) {
			return showMarker(this.map, point, option, textOption);
		},
		removeMarker(marker) {
			removeMarker(this.map, marker);
		},
		addSelectBox(val, callback) {
			showDarw.createDarw(this.map, this.mapLayerList(), val, callback);
		},

		showPathPlay(lines, option) {
			return showPathPlay(this.map, lines, option);
		},
		setMapVisible(isVisible){
			this.$nextTick(()=>{
				const ref = this.$refs.mapSwitch;
				ref.labelLayerVisibleEvt(isVisible, true)
			})
		}
	},
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.map-box {
	width: 100%;
	height: 100%;
	position: relative;
}
.map-container {
	position: absolute;
	top: 70px;
	width: 45px;
	height: 45px;
	right: 30px;
}
.selete-box {
	top: 130px;
}
</style>

<style >
	.map-box .ol-control button{
		background-color: #fff;
		font-size:0;
		width:24px;
		height: 24px;
		box-sizing: border-box;
		position: relative;
	}
	.map-box .ol-control .ol-zoom-in{
		border-bottom: 1px solid #ccc;
	}
	.map-box .ol-control .ol-zoom-in::before,
	.map-box .ol-control .ol-zoom-out::before,
	.map-box .ol-control .ol-zoom-in::before,
	.map-box .ol-control .ol-zoom-in::after{
		content: "";
		width:12px;
		height: 2px;
		background-color:#999;
		position: absolute;	
	 	top: 50%;
    left: 50%;
		transform: translate(-50%,-50%);
	}
	.map-box .ol-control .ol-zoom-in::after,
	.map-box .ol-control .ol-zoom-out::after{
		transform: translate(-50%,-50%) rotate(90deg);
	}
	.map-box .ol-control .ol-zoom-out::after{
		background-color: transparent;;
	}
	.map-box .ol-control{
		padding:2px;
		box-shadow: 0px 3px 1px -2px rgb(0 0 0 / 20%), 0px 2px 2px 0px rgb(0 0 0 / 14%), 0px 1px 5px 0px rgb(0 0 0 / 12%);
	}
</style>