import { defineComponent, onMounted, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Rhino3dmLoader } from 'three/addons/loaders/3DMLoader.js';
import { RhinoDocumentHandler } from './RhinoDocumentHandler'; // Import the RhinoDocumentHandler class
import { RhinoObjectIDRetriever } from './RhinoObjectIDRetriever'; // Import the RhinoObjectIDRetriever class
import { RhinoColorRetriever } from './RhinoColorRetriever'; // Import the RhinoColorRetriever class
import { RhinoObjectNameRetriever } from './RhinoObjectNameRetriever';
import { RhinoObjectLayerRetriever } from './RhinoObjectLayerRetriever';
export default defineComponent({
    name: 'RhinoViewer',
    setup() {
        const canvasContainer = ref(null);
        let scene;
        let camera;
        let renderer;
        let controls;
        const rhinoDocumentHandler = new RhinoDocumentHandler();
        const initThreeJS = () => {
            // Initialize the scene
            scene = new THREE.Scene();
            // Rotate the scene to match Rhino's coordinate system
            scene.rotation.x = -Math.PI / 2;
            // Initialize the camera
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
            camera.position.set(0, 0, 5);
            camera.lookAt(0, 0, 0);
            // Initialize the renderer
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            if (canvasContainer.value) {
                canvasContainer.value.appendChild(renderer.domElement);
            }
            // Add basic lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(5, 5, 5);
            scene.add(directionalLight);
            // Add an axis helper for visual reference
            const axesHelper = new THREE.AxesHelper(5);
            scene.add(axesHelper);
            // Initialize OrbitControls
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.25;
            controls.screenSpacePanning = false;
            controls.minDistance = 0.1;
            controls.maxDistance = 1000;
            controls.update();
            // Rotate controls to match the new orientation
            controls.target.set(0, 0, 0);
            controls.update();
            // Start the animation loop
            animate();
        };
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        const onFileChange = async (event) => {
            const input = event.target;
            if (input.files && input.files[0]) {
                console.log("File selected:", input.files[0].name);
                const file = input.files[0];
                try {
                    // Load the document using RhinoDocumentHandler
                    await rhinoDocumentHandler.loadDocument(file);
                    const rhinoDoc = rhinoDocumentHandler.getDocument();
                    const rhino = rhinoDocumentHandler.getRhinoModule();
                    console.log("Rhino document loaded:", rhinoDoc);
                    // Initialize and retrieve object IDs
                    const objectIDRetriever = new RhinoObjectIDRetriever(rhinoDoc, rhino);
                    objectIDRetriever.retrieveObjectIDs();
                    // Initialize and retrieve object names
                    const nameRetriever = new RhinoObjectNameRetriever(rhinoDoc, rhino);
                    nameRetriever.retrieveObjectNames();
                    // Initialize and retrieve object layer names
                    const layerRetriever = new RhinoObjectLayerRetriever(rhinoDoc, rhino);
                    layerRetriever.retrieveObjectLayers();
                    // Initialize and retrieve object colors
                    const colorRetriever = new RhinoColorRetriever(rhinoDoc, rhino);
                    colorRetriever.retrieveObjectColors();
                    // Use the Rhino3dmLoader to parse the file
                    const loader = new Rhino3dmLoader();
                    loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@8.4.0/');
                    const arrayBuffer = await file.arrayBuffer();
                    loader.parse(arrayBuffer, (object) => {
                        console.log("Object loaded:", object);
                        // Scale and center the object
                        object.scale.set(0.1, 0.1, 0.1);
                        scene.add(object);
                    }, undefined, // Skip the onProgress callback by passing undefined
                    (error) => {
                        console.error("Error loading the object:", error);
                    });
                }
                catch (error) {
                    console.error("Error loading document:", error);
                }
            }
        };
        onMounted(() => {
            initThreeJS();
        });
        return {
            canvasContainer,
            onFileChange,
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
    // CSS variable injection 
    // CSS variable injection end 
    let __VLS_resolvedLocalAndGlobalComponents;
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.input)({ ...{ onChange: (__VLS_ctx.onFileChange) }, type: ("file"), });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ref: ("canvasContainer"), ...{ class: ("canvas-container") }, });
    // @ts-ignore navigation for `const canvasContainer = ref()`
    __VLS_ctx.canvasContainer;
    __VLS_styleScopedClasses['canvas-container'];
    var __VLS_slots;
    var __VLS_inheritedAttrs;
    const __VLS_refs = {
        "canvasContainer": __VLS_nativeElements['div'],
    };
    var $refs;
    return {
        slots: __VLS_slots,
        refs: $refs,
        attrs: {},
    };
}
;
let __VLS_self;
//# sourceMappingURL=RhinoViewer.vue.js.map