import { defineComponent, ref } from 'vue';
import { Rhino3dmLoader } from 'three/addons/loaders/3DMLoader.js';
import { RhinoDocumentHandler } from './RhinoDocumentHandler';
import * as THREE from 'three';
export default defineComponent({
    name: 'RhinoManagement',
    emits: ['fileUploaded'],
    props: {
        onGeometryParsed: {
            type: Function,
            required: true,
        },
        isProductionTracking: {
            type: Boolean,
            required: true,
        },
    },
    setup(props, { emit }) {
        const file = ref(null);
        const showUploadBox = ref(true);
        const fileName = ref(null);
        const rhinoDocumentHandler = new RhinoDocumentHandler();
        const onFileChange = (event) => {
            const target = event.target;
            if (target.files && target.files.length > 0) {
                file.value = target.files[0];
                fileName.value = target.files[0].name; // Store the file name
                console.log("Emitting fileUploaded event with fileName:", fileName.value);
                emit('fileUploaded', fileName.value); // Emit file name to parent component
            }
            else {
                file.value = null; // Set file to null when no file is selected
            }
        };
        const processFile = async () => {
            if (!file.value)
                return;
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
                loader.parse(arrayBuffer, (parsedObject) => {
                    parsedObject.traverse((child) => {
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
                            const selectedUserStrings = userStrings.filter((entry) => entry[0] === 'Release' ||
                                entry[0] === 'Elevation' ||
                                entry[0] === 'PID' ||
                                entry[0] === 'PNL' ||
                                entry[0] === '%Unit-Dimension');
                            // Display the selected userStrings
                            selectedUserStrings.forEach(([key, value]) => {
                                // console.log(`${key}: ${value}`);
                            });
                            // Further processing like applying colors, etc.
                            const objectColor = userData.objectColor;
                            if (objectColor) {
                                const color = new THREE.Color(objectColor.r / 255, objectColor.g / 255, objectColor.b / 255);
                                if (child instanceof THREE.Mesh) {
                                    const material = new THREE.MeshStandardMaterial({ color });
                                    child.material = material;
                                }
                                else if (child instanceof THREE.Line) {
                                    const material = new THREE.LineBasicMaterial({ color });
                                    child.material = material;
                                }
                                else if (child instanceof THREE.Points) {
                                    const material = new THREE.PointsMaterial({ color });
                                    child.material = material;
                                }
                                else {
                                    console.warn(`Unhandled object type: ${child.type}`);
                                }
                            }
                            // Log the userData to check if productionTrackingColor has been applied
                            // console.log('User Data:', userData);
                        }
                        else {
                            // console.warn(`No userData found on object: ${child.type}`);
                        }
                    });
                    // Pass the object to ThreeJSScene
                    props.onGeometryParsed([parsedObject]);
                }, undefined, // Progress callback
                (error) => {
                    console.error('An error occurred while parsing the geometry', error);
                } // Handle errors
                );
            }
            catch (error) {
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
;
function __VLS_template() {
    const __VLS_ctx = {};
    const __VLS_localComponents = {
        ...{},
        ...{},
        ...__VLS_ctx,
    };
    let __VLS_components;
    const __VLS_localDirectives = {
        ...{},
        ...__VLS_ctx,
    };
    let __VLS_directives;
    let __VLS_styleScopedClasses;
    __VLS_styleScopedClasses['rhino-management'];
    // CSS variable injection 
    // CSS variable injection end 
    let __VLS_resolvedLocalAndGlobalComponents;
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("canvas-container") }, });
    if (__VLS_ctx.showUploadBox) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("rhino-management") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({ ...{ onChange: (__VLS_ctx.onFileChange) }, type: ("file"), accept: (".3dm"), });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (__VLS_ctx.processFile) }, disabled: ((!__VLS_ctx.file)), });
    }
    __VLS_styleScopedClasses['canvas-container'];
    __VLS_styleScopedClasses['rhino-management'];
    var __VLS_slots;
    var __VLS_inheritedAttrs;
    const __VLS_refs = {};
    var $refs;
    return {
        slots: __VLS_slots,
        refs: $refs,
        attrs: {},
    };
}
;
let __VLS_self;
//# sourceMappingURL=RhinoManagement.vue.js.map