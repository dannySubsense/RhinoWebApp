<template>
    <div id="app">
        <RhinoManagement :onGeometryParsed="handleGeometryParsed"
                         :isProductionTracking="isProductionTracking" />

        <div class="mode-switch" v-if="modelLoaded">
            <label class="toggle-label">
                <div class="mode-text">{{ isProductionTracking ? 'Production Tracking' : 'Wireframe Model' }}</div>
                <div class="switch-container">
                    <input type="checkbox" v-model="isProductionTracking" @change="toggleMode" />
                    <span class="slider"></span>
                </div>
            </label>
        </div>

        <!-- Excel Upload Button with class for styling -->
        <div v-if="isProductionTracking" class="excel-upload">
            <label for="excelUpload">Upload Excel File:</label>
            <input type="file" id="excelUpload" @change="handleExcelUpload" accept=".xlsx">
        </div>

        <ThreeJSScene ref="threeJSScene" :isProductionTracking="isProductionTracking"
                      @handleExcelUpload="handleExcelUpload" />
    </div>
</template>

<script lang="ts">
    import { defineComponent, ref } from 'vue';
    import RhinoManagement from './components/RhinoManagement.vue';
    import ThreeJSScene from './components/ThreeJSScene.vue';
    import * as THREE from 'three';    

    export default defineComponent({
        name: 'App',
        components: {
            RhinoManagement,
            ThreeJSScene,
        },
        setup() {
            const threeJSScene = ref<InstanceType<typeof ThreeJSScene> | null>(null);
            const isProductionTracking = ref(false);
            const modelLoaded = ref(false);

            const handleGeometryParsed = (objects: THREE.Object3D[]) => {
                if (threeJSScene.value && typeof threeJSScene.value.addObjectsToScene === 'function') {
                    threeJSScene.value.addObjectsToScene(objects);
                }
                modelLoaded.value = true; // Mark the model as loaded
            };

            const toggleMode = () => {
                if (threeJSScene.value && typeof threeJSScene.value.toggleMode === 'function') {
                    threeJSScene.value.toggleMode(isProductionTracking.value);
                }
            };

            const handleExcelUpload = (event: Event) => {
                // Forward the event to ThreeJSScene's handleExcelUpload
                if (threeJSScene.value && typeof threeJSScene.value.handleExcelUpload === 'function') {
                    threeJSScene.value.handleExcelUpload(event);
                }
            };

            return {
                threeJSScene,
                isProductionTracking,
                modelLoaded,
                handleGeometryParsed,
                toggleMode,
                handleExcelUpload,
            };
        },
    });

</script>

<style>
    #app {
        display: flex;
        flex-direction: column;
        height: 100vh; /* Full height for the app */
        margin: 0; /* Ensure no margin around the app */
        padding: 0;
        overflow: hidden;
    }

    .mode-switch {
        position: absolute;
        top: 20px;
        right: 20px;
        z-index: 10;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .toggle-label {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .switch-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 5px; /* Add space between text and switch */
    }

    input[type="checkbox"] {
        display: none; /* Hide the checkbox */
    }

    .slider {
        position: relative;
        width: 55px;
        height: 24px;
        background-color: #ccc;
        border-radius: 34px;
        cursor: pointer;
        transition: background-color 0.4s;
    }

        .slider:before {
            content: "";
            position: absolute;
            height: 20px;
            width: 20px;
            left: 4px;
            bottom: 2px;
            background-color: white;
            border-radius: 50%;
            transition: transform 0.4s;
        }

    input:checked + .slider:before {
        transform: translateX(26px);
    }

    input:checked + .slider {
        background-color: #2196F3;
    }

    .mode-text {
        font-size: 14px;
        color: #333;
        margin-bottom: 5px; /* Add space below the text */
        width: 160px; /* Set a fixed width to avoid the switch moving */
        text-align: center;
    }

    label[for="excelUpload"] {
        font-size: 16px;
        font-weight: bold;
        color: #333;
        margin-top: 5px;
        display: block;
    }

    /* Adjust the positioning to ensure it doesn't overlap with other elements */
    div.excel-upload {
        position: absolute;
        bottom: 20px; /* Adjust as needed */
        right: 20px; /* You can change the positioning based on preference */
        z-index: 20; /* Ensure it's above other elements */
        background-color: rgba(255, 255, 255, 0.8); /* #f9f9f9; /* Add background for visibility */
        padding: 10px; /* Add padding for better presentation */
        border-radius: 8px; /* Style the box */
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3); /* Shadow to differentiate it */
    }


</style>
