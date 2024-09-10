<script lang="ts">
    import { defineComponent, onMounted, ref } from 'vue';
    import * as THREE from 'three';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
    import { Rhino3dmLoader } from 'three/addons/loaders/3DMLoader.js';

    export default defineComponent({
        name: 'RhinoViewer',
        setup() {
            const canvasContainer = ref<HTMLDivElement | null>(null);
            let scene: THREE.Scene;
            let camera: THREE.PerspectiveCamera;
            let renderer: THREE.WebGLRenderer;
            let controls: OrbitControls;

            const initThreeJS = () => {
                // Initialize the scene
                scene = new THREE.Scene();

                // Initialize the camera
                camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                camera.position.set(0, 0, 5); // Position the camera at a distance
                camera.lookAt(0, 0, 0); // Ensure the camera is looking at the origin

                // Initialize the renderer
                renderer = new THREE.WebGLRenderer({ antialias: true });
                renderer.setSize(window.innerWidth, window.innerHeight);
                if (canvasContainer.value) {
                    canvasContainer.value.appendChild(renderer.domElement); // Attach the renderer's DOM element to the canvas container
                }

                // Add basic lighting
                const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
                scene.add(ambientLight);

                const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
                directionalLight.position.set(5, 5, 5);
                scene.add(directionalLight);

                // Add an axis helper for visual reference
                const axesHelper = new THREE.AxesHelper(5); // 5 units length
                scene.add(axesHelper);

                // Initialize OrbitControls
                controls = new OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true; // Enable damping for smoother control
                controls.dampingFactor = 0.25;
                controls.screenSpacePanning = false;
                controls.minDistance = 0.1;
                controls.maxDistance = 1000;
                controls.update();

                // Start the animation loop
                animate();
            };


            const animate = () => {
                requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            };

            const onFileChange = async (event: Event) => {
                const input = event.target as HTMLInputElement;
                if (input.files && input.files[0]) {
                    console.log("File selected:", input.files[0].name); // Debug: confirm file is selected

                    const file = input.files[0];
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        console.log("File loaded into memory"); // Debug: confirm file is read into memory

                        const arrayBuffer = e.target?.result as ArrayBuffer;

                        // Use the Rhino3dmLoader to parse the file
                        const loader = new Rhino3dmLoader();
                        loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@8.4.0/'); // Use a CDN for the rhino3dm library

                        loader.parse(arrayBuffer, (object) => {
                            console.log("Object loaded:", object); // Debug: log the loaded object

                            // Scale and center the object
                            // object.scale.set(1, 1, 1);
                            // object.position.set(0, 0, 0);

                            scene.add(object); // Add the object to the scene
                        }, 
                        undefined, 
                        (error) => {
                            console.error("Error loading the object:", error); // Log any errors
                        });
                    };
                    reader.readAsArrayBuffer(file); // Read the uploaded file as an ArrayBuffer
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
</script>

<template>
    <div>
        <input type="file" @change="onFileChange" />
        <div ref="canvasContainer" class="canvas-container"></div>
    </div>
</template>

<style scoped>
    .canvas-container {
        width: 100%;
        height: 100vh;
        overflow: hidden;
    }
</style>
