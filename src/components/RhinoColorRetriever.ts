export class RhinoColorRetriever {
    private rhino: any;
    private rhinoDoc: any;

    constructor(rhinoDoc: any, rhino: any) {
        this.rhino = rhino;
        this.rhinoDoc = rhinoDoc;
    }

    retrieveObjectColors(): { objectId: string, color: { r: number, g: number, b: number } | null }[] {
        const objects = this.rhinoDoc.objects();
        const objectCount = objects.count;
        const colorsData = [];

        for (let i = 0; i < objectCount; i++) {
            const rhinoObject = objects.get(i);
            const attributes = rhinoObject.attributes();
            const objectId = attributes.id;
            const colorSource = attributes.colorSource;
            let displayColor = null;

            switch (colorSource) {
                case this.rhino.ObjectColorSource.ColorFromLayer:
                    const layerIndex = attributes.layerIndex;
                    const layer = this.rhinoDoc.layers().get(layerIndex);
                    displayColor = layer.color();
                    break;
                case this.rhino.ObjectColorSource.ColorFromObject:
                    displayColor = attributes.objectColor;
                    break;
                // case this.rhino.ObjectColorSource.ColorFromMaterial:
                    // const materialIndex = attributes.materialIndex;
                    // const material = this.rhinoDoc.materials().get(materialIndex);
                    // displayColor = material.diffuseColor();
                    // break;
                default:
                    console.warn(`Unknown color source for object ID: ${objectId}`);
            }

            colorsData.push({
                objectId,
                color: displayColor ? { r: displayColor.r, g: displayColor.g, b: displayColor.b } : null
            });
        }

        return colorsData;
    }
}
