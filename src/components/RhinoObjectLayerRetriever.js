export class RhinoObjectLayerRetriever {
    constructor(rhinoDoc, rhino) {
        this.rhino = rhino;
        this.rhinoDoc = rhinoDoc;
    }
    retrieveObjectLayers() {
        const objects = this.rhinoDoc.objects();
        const objectCount = objects.count;
        const layersData = [];
        for (let i = 0; i < objectCount; i++) {
            const rhinoObject = objects.get(i);
            const attributes = rhinoObject.attributes();
            const objectId = attributes.id;
            const layerIndex = attributes.layerIndex;
            const layer = this.rhinoDoc.layers().get(layerIndex);
            const layerName = layer.name;
            const layerColor = layer.color;
            const layerVisibility = layer.visible;
            layersData.push({
                objectId,
                layerName,
                layerColor,
                layerVisibility
            });
        }
        return layersData;
    }
}
//# sourceMappingURL=RhinoObjectLayerRetriever.js.map