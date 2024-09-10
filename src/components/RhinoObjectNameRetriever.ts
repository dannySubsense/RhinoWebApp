export class RhinoObjectNameRetriever {
    private rhino: any;
    private rhinoDoc: any;

    constructor(rhinoDoc: any, rhino: any) {
        this.rhino = rhino;
        this.rhinoDoc = rhinoDoc;
    }

    retrieveObjectNames(): { objectId: string, objectName: string }[] {
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
