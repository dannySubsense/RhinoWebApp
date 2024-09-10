export class RhinoObjectIDRetriever {
    private rhino: any;
    private rhinoDoc: any;

    constructor(rhinoDoc: any, rhino: any) {
        this.rhino = rhino;
        this.rhinoDoc = rhinoDoc;
    }

    retrieveObjectIDs(): string[] {
        const objects = this.rhinoDoc.objects();
        const objectCount = objects.count;
        const idsData: string[] = [];

        for (let i = 0; i < objectCount; i++) {
            const rhinoObject = objects.get(i);
            const objectId = rhinoObject.attributes().id;
            idsData.push(objectId);
        }

        return idsData;
    }
}
