import rhino3dm from 'rhino3dm';

export class RhinoDocumentHandler {
    private rhino: any;
    private doc: any;

    constructor() {
        this.rhino = null;
        this.doc = null;
    }

    async initializeRhino(): Promise<void> {
        this.rhino = await rhino3dm(); // Initialize Rhino3dm
        if (!this.rhino) {
            throw new Error("Failed to initialize Rhino3dm.");
        }
        console.log('Rhino3dm module initialized successfully.');
    }

    async loadDocument(file: File): Promise<void> {
        if (!this.rhino) {
            await this.initializeRhino(); // Ensure Rhino3dm is initialized
        }

        const buffer = await file.arrayBuffer();
        const byteArray = new Uint8Array(buffer);

        this.doc = this.rhino.File3dm.fromByteArray(byteArray);

        if (!this.doc) {
            throw new Error('Failed to load 3dm file.');
        }

        console.log('3dm file successfully loaded into rhino3dm.File3dm instance.');
    }

    getDocument(): any {
        return this.doc;
    }

    getRhinoModule(): any {
        return this.rhino;
    }
}
