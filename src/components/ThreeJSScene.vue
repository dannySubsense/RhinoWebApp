<template>
    <div ref="canvasContainer" class="canvas-container" @mousedown="onCanvasClick"></div>
    <div v-if="selectedObjectData" class="info-box">
        <p><strong>Object Name:</strong> {{ selectedObjectData.name }}</p>
        <p v-if="selectedObjectData.release"><strong>Release:</strong> {{ selectedObjectData.release }}</p>
        <p v-if="selectedObjectData.elevation"><strong>Elevation:</strong> {{ selectedObjectData.elevation }}</p>
        <p v-if="selectedObjectData.pid"><strong>PID:</strong> {{ selectedObjectData.pid }}</p>
        <p v-if="selectedObjectData.pnl"><strong>PNL:</strong> {{ selectedObjectData.pnl }}</p>
        <p v-if="selectedObjectData.unitDimension"><strong>Unit Dimension:</strong> {{ selectedObjectData.unitDimension }}</p>
        <p v-if="selectedObjectData.productionTrackingPhase"><strong>Production Phase:</strong> {{ selectedObjectData.productionTrackingPhase }}</p>

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

        emits: ['handleExcelUpload', 'updateCounts'],

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

            // Instantiate ProductionColorHandler and ProcessExcelFile here
            const productionColorHandler = new ProductionColorHandler();  // Correctly initialize this instance
            const processExcelFile = new ProcessExcelFile();  // Correctly initialize this instance                        

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
                    let totalPanels = 0; // Initialize panel count

                    // Apply the productionTrackingColor (initialized to gray) to all objects
                    scene.traverse((object: any) => {
                        if (object.userData?.attributes?.productionTrackingColor) {
                            totalPanels++; // Count the object
                            const prodColor = new THREE.Color(object.userData.attributes.productionTrackingColor);
                            if (object.material) {
                                console.log("Changing color for object:", object);
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

                    // Emit total panel count to App.vue for the "Total" count in the legend
                    emit('updateCounts', productionColorHandler.getPhaseCounts(), totalPanels);

                    console.log(`Total panels in Production Tracking Mode: ${totalPanels}`);
                } else {
                    // Revert to the original Rhino colors
                    scene.traverse((object: any) => {
                        if (object.userData?.attributes?.objectColor) {
                            const originalColor = new THREE.Color(
                                object.userData.attributes.objectColor.r / 255,
                                object.userData.attributes.objectColor.g / 255,
                                object.userData.attributes.objectColor.b / 255
                            );
                            if (object.material) {
                                object.material.color.copy(originalColor);
                            }
                        }
                    });
                }
            };


            const handleExcelUpload = async (event: Event) => {
                console.log('File selected for upload');
                const file = (event.target as HTMLInputElement).files?.[0];

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

                    } catch (error) {
                        console.error("Error parsing Excel file:", error);
                    }
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
</style>
