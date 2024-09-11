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
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const selectedObjectData = ref(null);
        let selectedObject = null;
        let originalColor = null;
        const initThreeJS = () => {
            // Initialize the scene
            scene = new THREE.Scene();
            // Rotate the scene to match Rhino's coordinate system
            scene.rotation.x = -Math.PI / 2;
            // Add an axes helper to indicate the scene is loaded
            const axesHelper = new THREE.AxesHelper(100);
            scene.add(axesHelper);
            // Initialize the camera
            const aspectRatio = window.innerWidth / window.innerHeight;
            camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 20000);
            camera.position.set(0, 0, 1000);
            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });
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
        const addObjectsToScene = (objects) => {
            objects.forEach(object => {
                console.log(`Adding object to scene: ${object.name}, ID: ${object.userData.id}, Layer: ${object.userData.layer}`);
                scene.add(object);
            });
        };
        const onCanvasClick = (event) => {
            if (!canvasContainer.value || !camera || !scene)
                return;
            const rect = canvasContainer.value.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            // Increase raycaster's far plane for better detection at zoomed out views
            raycaster.far = camera.far;
            const intersects = raycaster.intersectObjects(scene.children, true);
            if (intersects.length > 0) {
                const intersectedObject = intersects[0].object;
                // Reset the previous selection
                if (selectedObject && originalColor) {
                    if (selectedObject instanceof THREE.Mesh) {
                        selectedObject.material.color.copy(originalColor);
                    }
                    else if (selectedObject instanceof THREE.Line) {
                        selectedObject.material.color.copy(originalColor);
                    }
                    else if (selectedObject instanceof THREE.Points) {
                        selectedObject.material.color.copy(originalColor);
                    }
                }
                selectedObject = intersectedObject;
                if (selectedObject instanceof THREE.Mesh) {
                    originalColor = selectedObject.material.color.clone();
                    selectedObject.material.color.setHex(0xffff00);
                }
                else if (selectedObject instanceof THREE.Line) {
                    originalColor = selectedObject.material.color.clone();
                    selectedObject.material.color.setHex(0xffff00);
                }
                else if (selectedObject instanceof THREE.Points) {
                    originalColor = selectedObject.material.color.clone();
                    selectedObject.material.color.setHex(0xffff00);
                }
                else {
                    console.warn('Selected object is not of a type with material:', selectedObject.type);
                    selectedObject = null;
                    originalColor = null;
                    selectedObjectData.value = null;
                    return;
                }
                const userData = intersectedObject.userData.attributes;
                selectedObjectData.value = {
                    name: userData.name,
                    release: userData.userStrings.find((str) => str[0] === 'Release')?.[1],
                    elevation: userData.userStrings.find((str) => str[0] === 'Elevation')?.[1],
                    pid: userData.userStrings.find((str) => str[0] === 'PID')?.[1],
                    pnl: userData.userStrings.find((str) => str[0] === 'PNL')?.[1],
                    unitDimension: userData.userStrings.find((str) => str[0] === '%Unit-Dimension')?.[1],
                };
            }
            else {
                // No object selected
                if (selectedObject && originalColor) {
                    if (selectedObject instanceof THREE.Mesh) {
                        selectedObject.material.color.copy(originalColor);
                    }
                    else if (selectedObject instanceof THREE.Line) {
                        selectedObject.material.color.copy(originalColor);
                    }
                    else if (selectedObject instanceof THREE.Points) {
                        selectedObject.material.color.copy(originalColor);
                    }
                }
                selectedObject = null;
                originalColor = null;
                selectedObjectData.value = null;
            }
        };
        onMounted(() => {
            initThreeJS();
        });
        return {
            canvasContainer,
            addObjectsToScene,
            onCanvasClick,
            selectedObjectData,
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
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ onMousedown: (__VLS_ctx.onCanvasClick) }, ref: ("canvasContainer"), ...{ class: ("canvas-container") }, });
    // @ts-ignore
    (__VLS_ctx.canvasContainer);
    // @ts-ignore
    [onCanvasClick, canvasContainer,];
    if (__VLS_ctx.selectedObjectData) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("info-box") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        // @ts-ignore
        [selectedObjectData,];
        (__VLS_ctx.selectedObjectData.name);
        // @ts-ignore
        [selectedObjectData,];
        if (__VLS_ctx.selectedObjectData.release) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            // @ts-ignore
            [selectedObjectData,];
            (__VLS_ctx.selectedObjectData.release);
            // @ts-ignore
            [selectedObjectData,];
        }
        if (__VLS_ctx.selectedObjectData.elevation) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            // @ts-ignore
            [selectedObjectData,];
            (__VLS_ctx.selectedObjectData.elevation);
            // @ts-ignore
            [selectedObjectData,];
        }
        if (__VLS_ctx.selectedObjectData.pid) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            // @ts-ignore
            [selectedObjectData,];
            (__VLS_ctx.selectedObjectData.pid);
            // @ts-ignore
            [selectedObjectData,];
        }
        if (__VLS_ctx.selectedObjectData.pnl) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            // @ts-ignore
            [selectedObjectData,];
            (__VLS_ctx.selectedObjectData.pnl);
            // @ts-ignore
            [selectedObjectData,];
        }
        if (__VLS_ctx.selectedObjectData.unitDimension) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            // @ts-ignore
            [selectedObjectData,];
            (__VLS_ctx.selectedObjectData.unitDimension);
            // @ts-ignore
            [selectedObjectData,];
        }
    }
    if (typeof __VLS_styleScopedClasses === 'object' && !Array.isArray(__VLS_styleScopedClasses)) {
        __VLS_styleScopedClasses['canvas-container'];
        __VLS_styleScopedClasses['info-box'];
    }
    var __VLS_slots;
    return __VLS_slots;
    const __VLS_componentsOption = {};
    const __VLS_name = 'ThreeJSScene';
    let __VLS_internalComponent;
}
