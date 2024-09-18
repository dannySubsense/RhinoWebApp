import { defineComponent, onMounted, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
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
            // Add an axes helper to indicate the scene is loaded
            const axesHelper = new THREE.AxesHelper(50);
            scene.add(axesHelper);
            // Initialize the camera
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
            camera.position.set(0, 0, 500);
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
            // Initialize OrbitControls
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.25;
            // Rotate the controls to match the scene rotation
            controls.object.rotation.x = -Math.PI / 2;
            controls.update();
            // Start the render loop
            const animate = () => {
                requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            };
            animate();
        };
        // Define the addObjectsToScene method
        const addObjectsToScene = (objects) => {
            objects.forEach(object => {
                console.log(`Adding object to scene: ${object.name}, ID: ${object.userData.id}, Layer: ${object.userData.layer}`);
                scene.add(object);
            });
        };
        onMounted(() => {
            initThreeJS();
        });
        return {
            canvasContainer,
            addObjectsToScene,
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
//# sourceMappingURL=ThreeJSScene%20(09012024).vue.js.map