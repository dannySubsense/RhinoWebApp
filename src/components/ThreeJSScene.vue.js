import { defineComponent, onMounted, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls, } from 'three/examples/jsm/controls/OrbitControls';
import { ProcessExcelFile } from './ProcessExcelFile';
import { ProductionColorHandler } from './ProductionColorHandler';
import { EdgesGeometry, LineBasicMaterial, LineSegments } from 'three';
export default defineComponent({
    name: 'ThreeJSScene',
    props: {
        isProductionTracking: {
            type: Boolean,
            required: true,
        },
        productionData: {
            type: Array,
            required: false,
        },
    },
    emits: ['handleExcelUpload', 'updateCounts'],
    setup(props, { emit }) {
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
        // Instantiate ProductionColorHandler and ProcessExcelFile here
        const productionColorHandler = new ProductionColorHandler(); // Correctly initialize this instance
        const processExcelFile = new ProcessExcelFile(); // Correctly initialize this instance                        
        const initThreeJS = () => {
            // Initialize the scene
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x000000); // Default to black (dark mode)
            // Rotate the scene to match Rhino's coordinate system
            scene.rotation.x = -Math.PI / 2;
            // Add an axes helper to indicate the scene is loaded
            const axesHelper = new THREE.AxesHelper(500);
            scene.add(axesHelper);
            // Add the grid helper to the 0,0,0 plane
            const gridHelper = new THREE.GridHelper(20000, 100); // Size 1000, 100 divisions
            gridHelper.rotation.x = Math.PI / 2; // Rotate the grid to lie on the Z=0 plane
            gridHelper.raycast = () => { }; // Disables raycasting on the grid
            scene.add(gridHelper);
            // Initialize the camera
            const aspectRatio = window.innerWidth / window.innerHeight;
            camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 1000000);
            camera.position.set(8000, 8000, 7000);
            camera.lookAt(scene.position);
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
                // Traverse all meshes in the object
                object.traverse(child => {
                    if (child instanceof THREE.Mesh) {
                        const material = child.material;
                        // Add this when traversing or adding objects to the scene
                        const geometry = child.geometry; // Assuming child is a THREE.Mesh
                        const edges = new EdgesGeometry(geometry); // Create edges for the geometry
                        const edgeMaterial = new LineBasicMaterial({ color: 0x36454F }); // Edge color (black)
                        const edgeLines = new LineSegments(edges, edgeMaterial);
                        // Modify the material to customize the back face rendering
                        material.onBeforeCompile = (shader) => {
                            // Add custom shader code to handle back-face coloring
                            shader.fragmentShader = shader.fragmentShader.replace('#include <dithering_fragment>', `
                        #include <dithering_fragment>
                        
                        // If rendering the back face, apply light gray color
                        if (!gl_FrontFacing) {
                            gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0); // gray color for back faces
                        }
                        `);
                        };
                        // Ensure double-sided rendering so both front and back faces are rendered
                        material.side = THREE.DoubleSide;
                        // Add the edges as a separate object to the scene
                        scene.add(edgeLines);
                    }
                });
                // Add the object to the scene
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
                    productionTrackingPhase: userData.productionTrackingPhase || 'Not Started' // Ensure it's handled safelye
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
        const toggleMode = (isProductionTracking) => {
            console.log("Toggle Mode called. Production Tracking:", isProductionTracking);
            if (isProductionTracking) {
                let totalPanels = 0; // Initialize panel count
                // Apply the productionTrackingColor (initialized to gray) to all objects
                scene.traverse((object) => {
                    if (object.userData?.attributes?.productionTrackingColor) {
                        totalPanels++; // Count the object
                        const prodColor = new THREE.Color(object.userData.attributes.productionTrackingColor);
                        if (object.material) {
                            console.log("Changing color for object:", object);
                            if (object.material instanceof THREE.MeshStandardMaterial) {
                                object.material.color.copy(prodColor);
                            }
                            else if (object.material instanceof THREE.LineBasicMaterial) {
                                object.material.color.copy(prodColor);
                            }
                            else if (object.material instanceof THREE.PointsMaterial) {
                                object.material.color.copy(prodColor);
                            }
                        }
                    }
                });
                // Emit total panel count to App.vue for the "Total" count in the legend
                emit('updateCounts', productionColorHandler.getPhaseCounts(), totalPanels);
                console.log(`Total panels in Production Tracking Mode: ${totalPanels}`);
            }
            else {
                // Revert to the original Rhino colors
                scene.traverse((object) => {
                    if (object.userData?.attributes?.objectColor) {
                        const originalColor = new THREE.Color(object.userData.attributes.objectColor.r / 255, object.userData.attributes.objectColor.g / 255, object.userData.attributes.objectColor.b / 255);
                        if (object.material) {
                            object.material.color.copy(originalColor);
                        }
                    }
                });
            }
        };
        const handleExcelUpload = async (event) => {
            console.log('File selected for upload');
            const file = event.target.files?.[0];
            if (file) {
                console.log(`Selected file: ${file.name}`);
                console.log('Attempting to parse the Excel file.');
                try {
                    // Parse the Excel file
                    const parsedData = await processExcelFile.parseExcelFile(file);
                    console.log('Parsed Excel Data:', parsedData);
                    console.log('Applying production colors to the scene...');
                    // Here is where ProductionColorHandler should be called
                    productionColorHandler.applyProductionColors(parsedData, scene);
                    console.log('Production colors applied to the scene.');
                    // After production colors are applied in ThreeJSScene.vue:
                    const phaseCounts = productionColorHandler.getPhaseCounts();
                    const totalUnits = productionColorHandler.getTotalUnits();
                    // Emit the counts back to App.vue
                    emit('updateCounts', phaseCounts, totalUnits);
                }
                catch (error) {
                    console.error("Error parsing Excel file:", error);
                }
            }
        };
        const applyColorsToScene = async () => {
            scene.traverse((object) => {
                if (object.userData?.attributes?.productionTrackingColor) {
                    console.log("Applying color:", object.userData.attributes.productionTrackingColor);
                    const color = new THREE.Color(object.userData.attributes.productionTrackingColor);
                    if (object.material) {
                        if (object.material instanceof THREE.MeshStandardMaterial) {
                            object.material.color.copy(color);
                        }
                        else if (object.material instanceof THREE.LineBasicMaterial) {
                            object.material.color.copy(color);
                        }
                        else if (object.material instanceof THREE.PointsMaterial) {
                            object.material.color.copy(color);
                        }
                    }
                }
            });
        };
        const toggleBackground = (isDarkMode) => {
            if (scene) {
                scene.background = new THREE.Color(isDarkMode ? 0x000000 : 0xffffff); // Toggle between black and white
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
            toggleMode,
            handleExcelUpload,
            toggleBackground,
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
    __VLS_styleScopedClasses['canvas-container'];
    // CSS variable injection 
    // CSS variable injection end 
    let __VLS_resolvedLocalAndGlobalComponents;
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ onMousedown: (__VLS_ctx.onCanvasClick) }, ref: ("canvasContainer"), ...{ class: ("canvas-container") }, });
    // @ts-ignore navigation for `const canvasContainer = ref()`
    __VLS_ctx.canvasContainer;
    if (__VLS_ctx.selectedObjectData) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("info-box") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.selectedObjectData.name);
        if (__VLS_ctx.selectedObjectData.release) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.selectedObjectData.release);
        }
        if (__VLS_ctx.selectedObjectData.elevation) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.selectedObjectData.elevation);
        }
        if (__VLS_ctx.selectedObjectData.pid) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.selectedObjectData.pid);
        }
        if (__VLS_ctx.selectedObjectData.pnl) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.selectedObjectData.pnl);
        }
        if (__VLS_ctx.selectedObjectData.unitDimension) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.selectedObjectData.unitDimension);
        }
        if (__VLS_ctx.selectedObjectData.productionTrackingPhase) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.selectedObjectData.productionTrackingPhase);
        }
    }
    __VLS_styleScopedClasses['canvas-container'];
    __VLS_styleScopedClasses['info-box'];
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
//# sourceMappingURL=ThreeJSScene.vue.js.map