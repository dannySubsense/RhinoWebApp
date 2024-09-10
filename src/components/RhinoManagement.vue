<template>
    <div class="canvas-container">
        <!-- Rhino management upload box -->
        <div v-if="showUploadBox" class="rhino-management">
            <h2>Upload Rhino File</h2>
            <input type="file" @change="onFileChange" accept=".3dm" />
            <button @click="processFile" :disabled="!file">Process Rhino File</button>
        </div>
    </div>
</template>



<script lang="ts">
    import { defineComponent, ref, PropType } from 'vue';
    import { Rhino3dmLoader } from 'three/addons/loaders/3DMLoader.js';
    import { RhinoDocumentHandler } from './RhinoDocumentHandler';
    import * as THREE from 'three';


    export default defineComponent({
        name: 'RhinoManagement',
        emits: ['fileUploaded'],
        props: {
            onGeometryParsed: {
                type: Function as PropType<(objects: THREE.Object3D[]) => void>,
                required: true,
            },
            isProductionTracking: {
                type: Boolean,
                required: true,
            },

        },
        setup(props, { emit }) {
            const file = ref<File | null>(null);
            const showUploadBox = ref(true);
            const fileName = ref<string | null>(null);
            const rhinoDocumentHandler = new RhinoDocumentHandler();

            const onFileChange = (event: Event) => {
                const target = event.target as HTMLInputElement;
                if (target.files && target.files.length > 0) {
                    file.value = target.files[0];
                    fileName.value = target.files[0].name; // Store the file name
                    console.log("Emitting fileUploaded event with fileName:", fileName.value);
                    emit('fileUploaded', fileName.value); // Emit file name to parent component
                } else {
                    file.value = null; // Set file to null when no file is selected
                }
            };


            const processFile = async () => {
                if (!file.value) return;
                // Hide the upload box
                showUploadBox.value = false;


                try {


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

                                    // Initialize productionTrackingColor if not present
                                    if (!userData.productionTrackingColor) {
                                        userData.productionTrackingColor = '#808080'; // Default gray color for "Not Started"
                                    }


                                    // Initialize productionTrackingPhase with "Not Started"
                                    if (!userData.productionTrackingPhase) {
                                        userData.productionTrackingPhase = "Not Started";
                                    }

                                    // Extract the object name
                                    const objectName = userData.name;
                                    // console.log(`Object Name: ${objectName}`);

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
                                    selectedUserStrings.forEach(([key, value]: string) => {
                                        // console.log(`${key}: ${value}`);
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

                                    // Log the userData to check if productionTrackingColor has been applied
                                    // console.log('User Data:', userData);

                                } else {
                                    // console.warn(`No userData found on object: ${child.type}`);
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
                fileName,
                showUploadBox,
                onFileChange,
                processFile,
            };
        },
    });
</script>

<style scoped>
    .canvas-container {
        width: 100%;
        height: 100vh;
        display: flex;
        justify-content: center; /* Horizontally center */
        align-items: center; /* Vertically center */
        position: relative;
        background-color: transparent; /* Ensure the background doesn't cover it */
    }

    .rhino-management {
        background-color: rgba(255, 255, 255, 0.9); /* Light background */
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3); /* Slight shadow */
        text-align: center; /* Center text */
        z-index: 1000; /* Ensure it stays on top of other elements */
        position: fixed; /* Fixed positioning for it to stay centered on the viewport */
        top: 50%; /* Center vertically */
        left: 50%; /* Center horizontally */
        transform: translate(-50%, -50%); /* Shift to the actual center */
        color: gray; /* Change text color to gray */
    }

        .rhino-management input[type="file"] {
            margin: 10px 0;
            /*color: gray;  /* Change text color to gray */
        }

    .file-name {
        position: absolute;
        top: 20px;
        left: 20px;
        background-color: rgba(255, 255, 255, 0.8);
        padding: 5px 10px;
        border-radius: 5px;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
        z-index: 100; /* Ensure file name display stays on top as well */
    }
</style>


