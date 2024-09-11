export class RhinoObjectNameRetriever {
    constructor(rhinoDoc, rhino) {
        this.rhino = rhino;
        this.rhinoDoc = rhinoDoc;
    }
    retrieveObjectNames() {
        const objects = this.rhinoDoc.objects();
        const objectCount = objects.count;
        const namesData = [];
        for (let i = 0; i < objectCount; i++) {
            const rhinoObject = objects.get(i);
            const attributes = rhinoObject.attributes();
            const objectId = attributes.id;
            const objectName = attributes.name;
            namesData.push({
                objectId,
                objectName
            });
        }
        return namesData;
    }
}
