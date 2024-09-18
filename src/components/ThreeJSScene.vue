<template>


    <div ref="canvasContainer" class="canvas-container" @mousedown="onCanvasClick"></div>
    <div v-if="selectedObjectData" class="info-box">
        <p><strong>Panel Name:</strong> {{ selectedObjectData.name }}</p>
        <p v-if="selectedObjectData.release"><strong>Release:</strong> {{ selectedObjectData.release }}</p>
        <p v-if="selectedObjectData.elevation"><strong>Elevation:</strong> {{ selectedObjectData.elevation }}</p>
        <p v-if="selectedObjectData.pid"><strong>PID:</strong> {{ selectedObjectData.pid }}</p>
        <p v-if="selectedObjectData.pnl"><strong>PNL:</strong> {{ selectedObjectData.pnl }}</p>
        <p v-if="selectedObjectData.unitDimension"><strong>Unit Dimension:</strong> {{ selectedObjectData.unitDimension }}</p>
        <p v-if="selectedObjectData.productionTrackingPhase"><strong>Production Phase:</strong> {{ selectedObjectData.productionTrackingPhase }}</p>
    </div>

    <!-- Camera Control Box -->
    <div v-if="isProductionTracking" class="camera-control-box">
        <!-- Header row with two headers: "Select View" and "Save Camera Position" -->
        <div class="camera-controls-header">
            <span class="select-header">Select View</span>
            <span class="save-header">Save Camera Position</span>
        </div>

        <!-- Camera view rows with a "Select" button, view label, "Save" button, and position display -->
        <div class="camera-view-row" v-for="view in cameraViews" :key="view">

            <!-- Round Select button (radio button behavior) -->
            <button class="circle-button select-button"
                    :class="{ selected: selectedView === view }"
                    @click="selectView(view)">
            </button>

            <!-- Camera view label -->
            <span class="camera-view-label">{{ view }}</span>

            <!-- Momentary Save button on the right -->
            <button class="circle-button save-button"
                    :class="{ active: isSaving && selectedView === view }"
                    :disabled="selectedView !== view"
                    @click="saveView(view)">
            </button>

            <!-- Camera position display -->
            <span class="camera-position">{{ getCameraPosition(view) }}</span>
        </div>
    </div>
    

</template>

<script lang="ts">
    import { defineComponent, onMounted, ref, watch } from 'vue';
    import * as THREE from 'three';
    import { OrbitControls,  } from 'three/examples/jsm/controls/OrbitControls';
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
                cameraViews: ["View 1", "View 2", "View 3", "View 4"] as string[], // Define as an array of strings
                savedPositions: {  // Placeholder for saved camera positions
                    "View 1": "Camera Position",
                    "View 2": "Camera Position",
                    "View 3": "Camera Position",
                    "View 4": "Camera Position",
                } as Record<string, string>, // Define the object as a record with string keys and values
                selectedView: "",  // Track the currently selected view (only one active at a time)  
                isSaving: false,  // Track if the user is currently saving a camera position
            };
        },

        methods: {
            // Select the view (radio button behavior)
            selectView(view: string) {
                this.selectedView = view; // Only one view can be selected at a time
            },

            // Momentary save action (only allowed when the view is selected)
            saveView(view: string) {
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
            getCameraPosition(view: string): string {
                return this.savedPositions[view];
            },

        },

        emits: ['handleExcelUpload', 'updateCounts', 'updateTotalUnits'],

        setup(props, { emit }) {
            const canvasContainer = ref<HTMLDivElement | null>(null);
            let scene: THREE.Scene;
            let camera: THREE.PerspectiveCamera;
            let renderer: THREE.WebGLRenderer;
            let controls: OrbitControls;
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();
            const selectedObjectData = ref<any | null>(null);
            let selectedObject: THREE.Object3D | null = null;
            let originalColor: THREE.Color | null = null;
            let productionColorHandler: ProductionColorHandler;

            // Instantiate ProductionColorHandler and ProcessExcelFile here            
            const processExcelFile = new ProcessExcelFile();  // Correctly initialize this instance

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

            const addObjectsToScene = (objects: THREE.Object3D[]) => {
                objects.forEach(object => {
                    // Traverse all meshes in the object
                    object.traverse(child => {
                        if (child instanceof THREE.Mesh) {
                            const material = child.material as THREE.ShaderMaterial;

                            // Add this when traversing or adding objects to the scene
                            const geometry = child.geometry; // Assuming child is a THREE.Mesh
                            const edges = new EdgesGeometry(geometry); // Create edges for the geometry
                            const edgeMaterial = new LineBasicMaterial({ color: 0x36454F }); // Edge color (black)
                            const edgeLines = new LineSegments(edges, edgeMaterial);

                            // Modify the material to customize the back face rendering
                            material.onBeforeCompile = (shader) => {
                                // Add custom shader code to handle back-face coloring
                                shader.fragmentShader = shader.fragmentShader.replace(
                                    '#include <dithering_fragment>',
                                    `
                        #include <dithering_fragment>
                        
                        // If rendering the back face, apply light gray color
                        if (!gl_FrontFacing) {
                            gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0); // gray color for back faces
                        }
                        `
                                );
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





            const countTotalUnitsInScene = (): number => {
                let totalUnits = 0;
                scene.traverse((object: any) => {
                    if (object.userData?.attributes?.userStrings) {
                        totalUnits++;
                    }
                });
                return totalUnits;
            };


            const onCanvasClick = (event: MouseEvent) => {
                if (!canvasContainer.value || !camera || !scene) return;

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
                            (selectedObject.material as THREE.MeshStandardMaterial).color.copy(originalColor);
                        } else if (selectedObject instanceof THREE.Line) {
                            (selectedObject.material as THREE.LineBasicMaterial).color.copy(originalColor);
                        } else if (selectedObject instanceof THREE.Points) {
                            (selectedObject.material as THREE.PointsMaterial).color.copy(originalColor);
                        }
                    }

                    selectedObject = intersectedObject;

                    if (selectedObject instanceof THREE.Mesh) {
                        originalColor = (selectedObject.material as THREE.MeshStandardMaterial).color.clone();
                        (selectedObject.material as THREE.MeshStandardMaterial).color.setHex(0xffff00);
                    } else if (selectedObject instanceof THREE.Line) {
                        originalColor = (selectedObject.material as THREE.LineBasicMaterial).color.clone();
                        (selectedObject.material as THREE.LineBasicMaterial).color.setHex(0xffff00);
                    } else if (selectedObject instanceof THREE.Points) {
                        originalColor = (selectedObject.material as THREE.PointsMaterial).color.clone();
                        (selectedObject.material as THREE.PointsMaterial).color.setHex(0xffff00);
                    } else {
                        console.warn('Selected object is not of a type with material:', selectedObject.type);
                        selectedObject = null;
                        originalColor = null;
                        selectedObjectData.value = null;
                        return;
                    }

                    const userData = intersectedObject.userData.attributes;
                    selectedObjectData.value = {
                        name: userData.name,
                        release: userData.userStrings.find((str: [string, string]) => str[0] === 'Release')?.[1],
                        elevation: userData.userStrings.find((str: [string, string]) => str[0] === 'Elevation')?.[1],
                        pid: userData.userStrings.find((str: [string, string]) => str[0] === 'PID')?.[1],
                        pnl: userData.userStrings.find((str: [string, string]) => str[0] === 'PNL')?.[1],
                        unitDimension: userData.userStrings.find((str: [string, string]) => str[0] === '%Unit-Dimension')?.[1],
                        productionTrackingPhase: userData.productionTrackingPhase || 'Not Started' // Ensure it's handled safelye
                    };
                } else {
                    // No object selected
                    if (selectedObject && originalColor) {
                        if (selectedObject instanceof THREE.Mesh) {
                            (selectedObject.material as THREE.MeshStandardMaterial).color.copy(originalColor);
                        } else if (selectedObject instanceof THREE.Line) {
                            (selectedObject.material as THREE.LineBasicMaterial).color.copy(originalColor);
                        } else if (selectedObject instanceof THREE.Points) {
                            (selectedObject.material as THREE.PointsMaterial).color.copy(originalColor);
                        }
                    }
                    selectedObject = null;
                    originalColor = null;
                    selectedObjectData.value = null;
                }
            };

            const toggleMode = (isProductionTracking: boolean) => {
                console.log("Toggle Mode called. Production Tracking:", isProductionTracking);

                if (isProductionTracking) {
                    // Apply production colors
                    scene.traverse((object: any) => {
                        if (object.userData?.attributes?.productionTrackingColor) {
                            const prodColor = new THREE.Color(object.userData.attributes.productionTrackingColor);
                            if (object.material) {
                                if (object.material instanceof THREE.MeshStandardMaterial) {
                                    object.material.color.copy(prodColor);
                                } else if (object.material instanceof THREE.LineBasicMaterial) {
                                    object.material.color.copy(prodColor);
                                } else if (object.material instanceof THREE.PointsMaterial) {
                                    object.material.color.copy(prodColor);
                                }
                            }
                        }
                    });

                    // Emit counts and percentages without modifying totalUnits
                    const { percentages, notStartedPercentage } = productionColorHandler.getPercentages();
                    const { phaseCounts, totalUnits: handlerTotalUnits } = productionColorHandler;

                    emit('updateCounts', {
                        phaseCounts,
                        totalUnits: handlerTotalUnits, // Use totalUnits from productionColorHandler
                        percentages,
                        notStarted: productionColorHandler.notStarted,
                        notStartedPercentage
                    });

                    console.log(`Production Tracking Mode activated.`);
                } else {
                    // Revert colors as before
                    scene.traverse((object: any) => {
                        // Revert to original color or default color
                        if (object.material && object.userData?.attributes?.originalColor) {
                            const originalColor = new THREE.Color(object.userData.attributes.originalColor);
                            if (object.material instanceof THREE.MeshStandardMaterial) {
                                object.material.color.copy(originalColor);
                            }
                        }
                    });
                }
            };


            const handleExcelUpload = async (event: Event) => {
                console.log('handleExcelUpload triggered in ThreeJSScene.vue');
                const fileInput = event.target as HTMLInputElement;
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

                } catch (error) {
                    // Error handling
                    console.error("Error parsing Excel file:", error);
                }

            };




            const applyColorsToScene = async (): Promise<void> => {                
                scene.traverse((object: any) => {

                    if (object.userData?.attributes?.productionTrackingColor) {  
                        console.log("Applying color:", object.userData.attributes.productionTrackingColor);
                        const color = new THREE.Color(object.userData.attributes.productionTrackingColor);
                        if (object.material) {
                            if (object.material instanceof THREE.MeshStandardMaterial) {
                                object.material.color.copy(color);
                            } else if (object.material instanceof THREE.LineBasicMaterial) {
                                object.material.color.copy(color);
                            } else if (object.material instanceof THREE.PointsMaterial) {
                                object.material.color.copy(color);
                            }
                        }
                    }
                });
            };

            const toggleBackground = (isDarkMode: boolean) => {
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
</script>

<style scoped>
    .canvas-container {
        width: 100%;
        height: 100vh;
        overflow: hidden;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
    }
    .info-box {
        position: absolute;
        top: 80px;
        left: 20px;
        background: rgba(255, 255, 255, 0.8);
        padding: 10px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
        color: #333; /* Dark gray text color */
    }
    .canvas-container {
        width: 100%;
        height: 100vh;
        position: absolute;
        top: 0;
        left: 0;
    }

    /* Camera Control Box Styling */
    .camera-control-box {
        position: absolute;
        top: 250px; /* Adjust according to logo and mode switch */
        right: 20px;
        width: 200px;
        height: fit-content;
        padding: 10px;
        background-color: rgba(255, 255, 255, 0.8); /* Transparent white background */
        border: 1px solid #ccc;
        border-radius: 8px;
        z-index: 10;
    }

    /* Header row for "Select View" and "Save Camera Position" */
    .camera-controls-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
        color: #2196F3;
        margin-bottom: 10px;
    }

    .select-header {
        flex-basis: 50%; /* Aligns with the Select button */
        text-align: left;
        font-size: 11px;       
    }

    .save-header {
        flex-basis: 80%; /* Aligns with the Save button */
        text-align: right;
        font-size: 11px;
    }

    /* Camera view row styling */
    .camera-view-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
    }

    /* Circle button base styling (radio button style for Select buttons) */
    .circle-button {
        width: 12px;
        height: 12px;
        border: 0.5px solid #80808061;
        border-radius: 50%;
        background-color: transparent;
        cursor: pointer;
        transition: background-color 0.3s, border-color 0.3s;
        box-sizing: border-box; /* Ensures consistent width and height */
        padding: 0; /* Remove padding */
    }

    /* Active (selected) state for Select buttons (radio button behavior) */
    .selected {
        background-color: #2196F3;
        border-color: #2196F3;
    }

    /* Disabled Save Button Styling */
    .save-button:disabled {
        background-color: #333; /* Light gray background */
        border-color: #333; /* Light gray border */
        opacity: 0.5; /* Reduced opacity */
        cursor: not-allowed; /* Disable the cursor */        
    }

    /* Active Save Button (for momentary click effect) */
    .save-button.active {
        background-color: #fc0373; /* Magenta background */
        border-color: #fc0373; /* Magenta border */
        outline: none; /* Remove the outline */
        cursor: pointer; /* Change cursor to pointer */
    }

    /* Also remove the outline on focus */
    .save-button:focus {
        outline: none;
    }

    /* Also remove the outline on focus */
    .select-button:focus {
        outline: none;
    }

    /* Camera view label styling */
    .camera-view-label {
        font-weight: initial;
        font-size: 11px;
        -webkit-flex-grow: inherit;
        flex-grow: inherit;
        text-align: center;
        color: #555; /* Lighter text color for positions */
    }

    /* Camera position display */
    .camera-position {
        /* margin-left: 10px;*/
        font-size: 11px;
        color: #555; /* Lighter text color for positions */
        }
</style>   