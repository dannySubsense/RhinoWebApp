import { defineComponent, onMounted, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Rhino3dmLoader } from 'three/addons/loaders/3DMLoader.js';
export default defineComponent({
    name: 'ThreeJSScene',
    setup() {
        const canvasContainer = ref(null);
        let scene;
        let camera;
        let renderer;
        let controls;
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
            // Add controls
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
                const file = input.files[0];
                const arrayBuffer = await file.arrayBuffer();
                // Load and process the Rhino file using Rhino3dmLoader
                const loader = new Rhino3dmLoader();
                loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@8.4.0/');
                loader.parse(arrayBuffer, (object) => {
                    console.log("Object loaded:", object);
                    object.scale.set(0.1, 0.1, 0.1);
                    scene.add(object);
                }, undefined, (error) => {
                    console.error("Error loading the object:", error);
                });
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
    let __VLS_ctx;
    /* Components */
    let __VLS_otherComponents;
    let __VLS_own;
    let __VLS_localComponents;
    let __VLS_components;
    let __VLS_styleScopedClasses;
    // CSS variable injection 
    // CSS variable injection end 
    let __VLS_resolvedLocalAndGlobalComponents;
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.input)({ ...{ onChange: (__VLS_ctx.onFileChange) }, type: ("file"), });
    // @ts-ignore
    [onFileChange,];
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ref: ("canvasContainer"), ...{ class: ("canvas-container") }, });
    // @ts-ignore
    (__VLS_ctx.canvasContainer);
    // @ts-ignore
    [canvasContainer,];
    if (typeof __VLS_styleScopedClasses === 'object' && !Array.isArray(__VLS_styleScopedClasses)) {
        __VLS_styleScopedClasses['canvas-container'];
    }
    var __VLS_slots;
    return __VLS_slots;
    const __VLS_componentsOption = {};
    const __VLS_name = 'ThreeJSScene';
    let __VLS_internalComponent;
}
//# sourceMappingURL=ThreeJSScene-bkup.vue.js.map