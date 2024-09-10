export class RhinoObjectIDRetriever {
    constructor(rhinoDoc, rhino) {
        this.rhino = rhino;
        this.rhinoDoc = rhinoDoc;
    }
    retrieveObjectIDs() {
        const objects = this.rhinoDoc.objects();
        const objectCount = objects.count;
        const idsData = [];
        for (let i = 0; i < objectCount; i++) {
            const rhinoObject = objects.get(i);
            const objectId = rhinoObject.attributes().id;
            idsData.push(objectId);
        }
        return idsData;
    }
}
//# sourceMappingURL=RhinoObjectIDRetriever.js.map