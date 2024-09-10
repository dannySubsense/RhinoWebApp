<template>
    <div v-if="showUploadBox" class="rhino-management">
        <h2>Upload Rhino File</h2>
        <input type="file" @change="onFileChange" accept=".3dm" />
        <button @click="processFile" :disabled="!file">Process Rhino File</button>
    </div>
    <div v-if="fileName" class="file-name">
        <p>{{ fileName }}</p>
    </div>
</template>

<script lang="ts">
    import { defineComponent, ref, PropType } from 'vue';
    import { Rhino3dmLoader } from 'three/addons/loaders/3DMLoader.js';
    import { RhinoDocumentHandler } from './RhinoDocumentHandler';
    import * as THREE from 'three';

    export default defineComponent({
        name: 'RhinoManagement',
        props: {
            onGeometryParsed: {
                type: Function as PropType<(objects: THREE.Object3D[]) => void>,
                required: true,
            },
        },
        setup(props) {
            const file = ref<File | null>(null);
            const showUploadBox = ref(true);
            const fileName = ref<string | null>(null);
            const rhinoDocumentHandler = new RhinoDocumentHandler();

            const onFileChange = (event: Event) => {
                const target = event.target as HTMLInputElement;
                if (target.files && target.files.length > 0) {
                    file.value = target.files[0];
                    fileName.value = target.files[0].name; // Store the file name
                }
                else {
                    file.value = null; // Set file to null when no file is selected
                }
            };

            const processFile = async () => {
                if (!file.value) return;

                try {
                    // Hide the upload box
                    showUploadBox.value = false;

                    // Load the document using RhinoDocumentHandler
                    await rhinoDocumentHandler.loadDocument(file.value);
                    const rhinoDoc = rhinoDocumentHandler.getDocument();
                    const rhino = rhinoDocumentHandler.getRhinoModule();
                    console.log('Rhino document loaded:', rhinoDoc);

                    // Create the Rhino3dmLoader instance
                    const loader = new Rhino3dmLoader();
                    loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@8.4.0/');

                    // Convert file to ArrayBuffer
                    const arrayBuffer = await file.value.arrayBuffer();

                    // Parse geometry using Rhino3dmLoader
                    loader.parse(
                        arrayBuffer,
                        (parsedObject: THREE.Object3D) => {
                            parsedObject.traverse((child: THREE.Object3D) => {
                                // Check if userData and attributes exist
                                if (child.userData && child.userData.attributes) {
                                    const userData = child.userData.attributes;

                                    // Extract the object name
                                    const objectName = userData.name;
                                    console.log(`Object Name: ${objectName}`);

                                    // Extract the userStrings array
                                    const userStrings = userData.userStrings;

                                    // Filter and display the selected userStrings
                                    const selectedUserStrings = userStrings.filter((entry: [string, string]) =>
                                        entry[0] === 'Release' ||
                                        entry[0] === 'Elevation' ||
                                        entry[0] === 'PID' ||
                                        entry[0] === 'PNL' ||
                                        entry[0] === '%Unit-Dimension'
                                    );

                                    // Display the selected userStrings
                                    selectedUserStrings.forEach(([key, value]) => {
                                        console.log(`${key}: ${value}`);
                                    });

                                    // Further processing like applying colors, etc.
                                    const objectColor = userData.objectColor;
                                    if (objectColor) {
                                        const color = new THREE.Color(objectColor.r / 255, objectColor.g / 255, objectColor.b / 255);

                                        if (child instanceof THREE.Mesh) {
                                            const material = new THREE.MeshStandardMaterial({ color });
                                            child.material = material;
                                        } else if (child instanceof THREE.Line) {
                                            const material = new THREE.LineBasicMaterial({ color });
                                            child.material = material;
                                        } else if (child instanceof THREE.Points) {
                                            const material = new THREE.PointsMaterial({ color });
                                            child.material = material;
                                        } else {
                                            console.warn(`Unhandled object type: ${child.type}`);
                                        }
                                    }
                                } else {
                                    console.warn(`No userData found on object: ${child.type}`);
                                }
                            });

                            // Pass the object to ThreeJSScene
                            props.onGeometryParsed([parsedObject]);
                        },
                        undefined, // Progress callback
                        (error: any) => {
                            console.error('An error occurred while parsing the geometry', error);
                        } // Handle errors
                    );

                } catch (error) {
                    console.error('Error processing file:', error);
                }
            };

            return {
                file,
                showUploadBox,
                fileName,
                onFileChange,
                processFile,
            };
        },
    });
</script>

<style scoped>
    .rhino-management {
        position: absolute;
        top: 20px;
        left: 20px;
        background: rgba(255, 255, 255, 0.7);
        padding: 10px;
        border-radius: 8px;
        /* box-shadow: 0 0 10px rgba(0, 0, 0, 0.3); */
        z-index: 10;
    }

    .file-name {
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        /* background: rgba(255, 255, 255, 0.9);
        padding: 5px;
        border-radius: 5px;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.3); */
        color: #808080;
        z-index: 9;
    }
</style>
