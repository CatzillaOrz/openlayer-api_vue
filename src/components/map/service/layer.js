import * as SMap from "@/assets/plugin/map.js";
const {VectorLayer ,ClusterVectorLayer ,  IconStyle} = SMap;
import { getUUID } from "./utils"

const defaultClusterOption={
  distance:100,
  minClusterResolution:17,
  canOffsetSingles: true,
}


export class LayerService{
  map = null;
  layerList = {}
  constructor(map){
    this.map = map;
  }
  createLayer(id = getUUID(),callback){
    if(!this.layerList[id]){
      const vectorLayer = new VectorLayer({
        id,
      });
      this.layerList[id] = vectorLayer;
      // this.layerList[id].eventManager.addEvent("click",(e)=>{
      //   e.data.data && e.data.data.click && e.data.data.click(e.data,e)
      //   callback && callback(e.data,e)
      //   console.log(e)
      // })
      this.layerList[id].eventOnClick = (e)=>{
        let v ,c;
        if(e.data && e.data.data && e.data.data.click){
          v =  e.data.data.click(e,e.data,)
        }
        if(callback){
          c = callback(e,e.data,) 
        }
        if(v === false  || c === false){
          return false
        }
      }
      this.map.addLayer(vectorLayer);
    }
    return {layer:this.layerList[id],id}
  }
  destroyLayer(layer){
    try{
      if(typeof layer === 'number'){
        const la = this.map.getLayerById(layer);
        la && this.map.removeLayer(la)
      }else{
        this.map.removeLayer(layer)
      }
      layer.clear();
      return true
    }catch(e){
      console.error(e);
      return false
    }
  }
  getLayerById(id){
    return this.layerList[id] || null;
  }
  getAllLayer(){
    return Object.values(this.layerList);
  }
  setVisible(id,visible){
    const layer = this.getLayerById(id)
    layer.setVisible(visible)
  }
  clearLayer(id){
    const layer = this.getLayerById(id)
    layer.clear()
  }


  createClusterLayer(id,option,callback){
    if(!this.layerList[id]){
      const styleInfo = new Style(option.clusteOption)
      const vectorLayer = new ClusterVectorLayer({
        ...defaultClusterOption,
        id,
        ...option,
        style:styleInfo.styleFunction
      });
      this.layerList[id] = vectorLayer;
      this.layerList[id].eventOnClick = (e)=>{
        let c;
        if(callback){
          c = callback(e,e.data,) 
        }
        if(c === false){
          return false
        }
      }
      this.map.addLayer(vectorLayer);
    }
    return {layer:this.layerList[id],id}
  }

}


class Style{
  constructor(clusterOption){
    this.clusterOption = clusterOption;
  }
  styleFunction(feature) {
    const features = feature.get("features");
    if (!features || !features.length) {
      if (!!feature) {
        return this.getSingleStye(feature);
      }
      return;
    }

    const size = features.length;
    // 所聚合点本身就有聚合的特征时

    if (size === 1) {
      return this.getSingleStye(features[0]);
    } else if (size > 1) {
      return this.getClusterBreakStyle(size);
    }
  }


  getSingleStye(singleFeature) {
    // const hasIconPath = singleFeature.get("properties") && singleFeature.get("properties")["iconPath"];
    const styleoption = singleFeature.getProperties().data.style;
    style = new IconStyle(
      styleoption
      // text:this.getText(name,{
      //   offsetY:-40
      // })
    ); 
    // style.setGeometry(singleFeature.getGeometry());
    // 如果没有传iconPath 对默认的样式做一层缓存  如果有就用自己的
    return style;
  }
  getClusterBreakStyle(size) {

    style = new IconStyle(
      {
        ...this.clusterOption,
        text: {
          ...this.clusterOption.text,
          text:size,
        }
      }
      // text:this.getText(name,{
      //   offsetY:-40
      // })
    ); 
    return style
  }
}