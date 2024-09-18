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
    data() {
        return {
            cameraViews: ["View 1", "View 2", "View 3", "View 4"], // Define as an array of strings
            savedPositions: {
                "View 1": "Camera Position",
                "View 2": "Camera Position",
                "View 3": "Camera Position",
                "View 4": "Camera Position",
            }, // Define the object as a record with string keys and values
            selectedView: "", // Track the currently selected view (only one active at a time)  
            isSaving: false, // Track if the user is currently saving a camera position
        };
    },
    methods: {
        // Select the view (radio button behavior)
        selectView(view) {
            this.selectedView = view; // Only one view can be selected at a time
        },
        // Momentary save action (only allowed when the view is selected)
        saveView(view) {
            if (this.selectedView === view) {
                console.log(`Saving camera position for ${view}`);
                // Trigger the save action momentarily
                this.isSaving = true;
                setTimeout(() => {
                    // this.saveCameraPosition(view);
                    this.isSaving = false;
                }, 250); // Delay the save action for 250ms
                // Get the current camera position and save it to the selected view
                // this.savedPositions[view] = this.getCameraPosition(view);
                this.savedPositions[view] = "Camera Position"; // Placeholder for camera position
            }
        },
        // Get the saved camers position for the specified view
        getCameraPosition(view) {
            return this.savedPositions[view];
        },
    },
    emits: ['handleExcelUpload', 'updateCounts', 'updateTotalUnits'],
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
        let productionColorHandler;
        // Instantiate ProductionColorHandler and ProcessExcelFile here            
        const processExcelFile = new ProcessExcelFile(); // Correctly initialize this instance
        // In the setup function (Vue 3 Composition API)
        const selectedView = ref(""); // Reactive variable to track the selected view
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
            // After adding objects to the scene, count total units
            const totalUnits = countTotalUnitsInScene();
            // Instantiate ProductionColorHandler with totalUnits
            productionColorHandler = new ProductionColorHandler(totalUnits);
        };
        const countTotalUnitsInScene = () => {
            let totalUnits = 0;
            scene.traverse((object) => {
                if (object.userData?.attributes?.userStrings) {
                    totalUnits++;
                }
            });
            return totalUnits;
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
        const initializeProductionColors = () => {
            scene.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    // Initialize productionTrackingColor to gray if it's not already set
                    if (!object.userData.attributes.productionTrackingColor) {
                        object.userData.attributes.productionTrackingColor = 0x808080; // Gray for Not Started
                    }
                }
            });
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
                // Emit total panel count and phase counts back to App.vue
                emit('updateCounts', {
                    phaseCounts: productionColorHandler.phaseCounts,
                    totalUnits: productionColorHandler.totalUnits, // Use totalUnits from productionColorHandler
                    notStarted: productionColorHandler.notStarted,
                    notStartedPercentage: productionColorHandler.getPercentages().notStartedPercentage
                });
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
            console.log('handleExcelUpload triggered in ThreeJSScene.vue');
            const fileInput = event.target;
            const file = fileInput.files ? fileInput.files[0] : null;
            if (!file) {
                console.error('No file selected');
                return;
            }
            try {
                // Parse the Excel file
                const parsedData = await processExcelFile.parseExcelFile(file);
                console.log('Parsed Excel Data:', parsedData);
                // Ensure productionColorHandler is instantiated
                if (!productionColorHandler) {
                    console.error('ProductionColorHandler is not initialized.');
                    return;
                }
                // Apply production colors using productionColorHandler
                productionColorHandler.applyProductionColors(parsedData, scene);
                // Get percentages for each phase after colors have been applied
                const { percentages, notStartedPercentage } = productionColorHandler.getPercentages();
                // Emit counts and percentages back to App.vue
                const { phaseCounts, totalUnits: handlerTotalUnits } = productionColorHandler;
                console.log('Emitting counts and percentages:', { phaseCounts, handlerTotalUnits, percentages, notStartedPercentage });
                emit('updateCounts', {
                    phaseCounts,
                    totalUnits: handlerTotalUnits,
                    percentages,
                    notStarted: productionColorHandler.notStarted,
                    notStartedPercentage,
                    updateTotalUnits: productionColorHandler.totalUnits,
                });
            }
            catch (error) {
                // Error handling
                console.error("Error parsing Excel file:", error);
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
        if (__VLS_ctx.selectedObjectData.productionTrackingPhase) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            // @ts-ignore
            [selectedObjectData,];
            (__VLS_ctx.selectedObjectData.productionTrackingPhase);
            // @ts-ignore
            [selectedObjectData,];
        }
    }
    if (__VLS_ctx.isProductionTracking) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("camera-control-box") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("camera-controls-header") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("select-header") }, });
        // @ts-ignore
        [isProductionTracking,];
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("save-header") }, });
        for (const [view] of __VLS_getVForSourceType((__VLS_ctx.cameraViews))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("camera-view-row") }, key: ((view)), });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                        if (!((__VLS_ctx.isProductionTracking)))
                            return;
                        __VLS_ctx.selectView(view);
                        // @ts-ignore
                        [cameraViews, selectView,];
                    } }, ...{ class: ("circle-button select-button") }, ...{ class: (({ selected: __VLS_ctx.selectedView === view })) }, });
            __VLS_styleScopedClasses = ({ selected: selectedView === view });
            // @ts-ignore
            [selectedView,];
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("camera-view-label") }, });
            (view);
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                        if (!((__VLS_ctx.isProductionTracking)))
                            return;
                        __VLS_ctx.saveView(view);
                        // @ts-ignore
                        [saveView,];
                    } }, ...{ class: ("circle-button save-button") }, ...{ class: (({ active: __VLS_ctx.isSaving && __VLS_ctx.selectedView === view })) }, disabled: ((__VLS_ctx.selectedView !== view)), });
            __VLS_styleScopedClasses = ({ active: isSaving && selectedView === view });
            // @ts-ignore
            [selectedView, selectedView, isSaving,];
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("camera-position") }, });
            (__VLS_ctx.getCameraPosition(view));
            // @ts-ignore
            [getCameraPosition,];
        }
    }
    if (typeof __VLS_styleScopedClasses === 'object' && !Array.isArray(__VLS_styleScopedClasses)) {
        __VLS_styleScopedClasses['canvas-container'];
        __VLS_styleScopedClasses['info-box'];
        __VLS_styleScopedClasses['camera-control-box'];
        __VLS_styleScopedClasses['camera-controls-header'];
        __VLS_styleScopedClasses['select-header'];
        __VLS_styleScopedClasses['save-header'];
        __VLS_styleScopedClasses['camera-view-row'];
        __VLS_styleScopedClasses['circle-button'];
        __VLS_styleScopedClasses['select-button'];
        __VLS_styleScopedClasses['camera-view-label'];
        __VLS_styleScopedClasses['circle-button'];
        __VLS_styleScopedClasses['save-button'];
        __VLS_styleScopedClasses['camera-position'];
    }
    var __VLS_slots;
    return __VLS_slots;
    const __VLS_componentsOption = {};
    const __VLS_name = 'ThreeJSScene';
    let __VLS_internalComponent;
}
//# sourceMappingURL=ThreeJSScene.vue.js.map