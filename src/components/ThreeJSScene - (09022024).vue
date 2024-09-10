<template>
    <div ref="canvasContainer" class="canvas-container" @mousedown="onCanvasClick"></div>
    <div v-if="selectedObjectData" class="info-box">
        <p><strong>Object Name:</strong> {{ selectedObjectData.name }}</p>
        <p v-if="selectedObjectData.release"><strong>Release:</strong> {{ selectedObjectData.release }}</p>
        <p v-if="selectedObjectData.elevation"><strong>Elevation:</strong> {{ selectedObjectData.elevation }}</p>
        <p v-if="selectedObjectData.pid"><strong>PID:</strong> {{ selectedObjectData.pid }}</p>
        <p v-if="selectedObjectData.pnl"><strong>PNL:</strong> {{ selectedObjectData.pnl }}</p>
        <p v-if="selectedObjectData.unitDimension"><strong>Unit Dimension:</strong> {{ selectedObjectData.unitDimension }}</p>
    </div>
</template>

<script lang="ts">
    import { defineComponent, onMounted, ref } from 'vue';
    import * as THREE from 'three';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

    export default defineComponent({
        name: 'ThreeJSScene',
        setup() {
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

            const addObjectsToScene = (objects: THREE.Object3D[]) => {
                objects.forEach(object => {
                    console.log(`Adding object to scene: ${object.name}, ID: ${object.userData.id}, Layer: ${object.userData.layer}`);
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
        top: 20px;
        left: 20px;
        background: rgba(255, 255, 255, 0.8);
        padding: 10px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    }
</style>
