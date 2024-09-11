import { ObjectColorSource } from 'rhino3dm'; // Import necessary components
export class RhinoColorHandler {
    static applyRhinoDisplayColors(object, rhinoDoc) {
        object.traverse((child) => {
            const attributes = child.userData?.attributes;
            if (attributes) {
                const objectId = attributes.id;
                const rhinoObject = rhinoDoc.objects().find((obj) => obj.id === objectId);
                if (rhinoObject) {
                    const colorSource = rhinoObject.attributes().colorSource;
                    let displayColor = null;
                    switch (colorSource) {
                        case ObjectColorSource.ColorFromLayer:
                            const layerIndex = rhinoObject.attributes().layerIndex;
                            const layer = rhinoDoc.layers().get(layerIndex);
                            displayColor = layer.color();
                            break;
                        case ObjectColorSource.ColorFromObject:
                            displayColor = rhinoObject.attributes().objectColor;
                            break;
                        case ObjectColorSource.ColorFromMaterial:
                            const materialIndex = rhinoObject.attributes().materialIndex;
                            const material = rhinoDoc.materials().get(materialIndex);
                            displayColor = material.diffuseColor();
                            break;
                        default:
                            console.warn('Unknown color source.');
                    }
                    if (displayColor) {
                        console.log(`Display color: ${displayColor.r}, ${displayColor.g}, ${displayColor.b}`);
                    }
                    else {
                        console.warn('No display color found or set for this object.');
                    }
                }
            }
            else {
                console.warn('No attributes found for this object.');
            }
        });
    }
}
