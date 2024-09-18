<template>
    <div id="app">
        <!-- Logo in the upper right corner -->
        <div class="logo-container">
            <img src="./assets/IEF_Logo_Right_Isolated.png" alt="Logo" class="logo" />
        </div>

        <!-- Rhino file name in the top center -->
        <div v-if="fileName" class="file-name-top">{{ fileName }}</div>

        <!-- RhinoManagement component to handle Rhino geometry parsing -->
        <RhinoManagement @fileUploaded="onFileUploaded"
                         @GeometryParsed="handleGeometryParsed"
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
            <input type="file" id="excelUpload" @change="handleExcelUpload" accept=".xlsx" />
        </div>

        <!-- Color Legend -->
        <div v-if="isProductionTracking" class="color-legend">
            <!-- "Not Started" label and color -->
            <div class="legend-item">
                <div class="color-box" style="background-color: #808080;"></div>
                <span class="legend-label">
                    Not Started: {{ notStartedCount || 0 }} units, ({{ notStartedPercentage || '0.00' }}%)
                </span>
            </div>

            <!-- Dynamically add the rest of the phases -->
            <div v-for="(color, label) in productionColorMapping" :key="label" class="legend-item">
                <div class="color-box" :style="{ backgroundColor: color }"></div>
                <span class="legend-label">
                    {{ label }}: {{ phaseCounts[label] || 0 }} units, ({{ getPhasePercentage(label) || '0.00' }}%)
                </span>
            </div>

            <!-- Total units at the bottom -->
            <div class="total-units">Total: {{ totalUnits || 0 }} units</div>
        </div>

        <!-- Dark Mode Theme -->
        <div class="toggle-theme">
            <button @click="toggleTheme">
                {{ isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode' }}
            </button>
        </div>

        <ThreeJSScene ref="threeJSScene"
                      :isProductionTracking="isProductionTracking"
                      @updateCounts="updateCounts"
                      @updateTotalUnits="handleUpdateTotalUnits"
                      @handleExcelUpload="handleExcelUpload" />
    </div>
</template>

<script lang="ts">
    import { defineComponent, ref, watch } from 'vue';
    import RhinoManagement from './components/RhinoManagement.vue';
    import ThreeJSScene from './components/ThreeJSScene.vue';
    import { ProductionColorHandler } from './components/ProductionColorHandler';
    import * as THREE from 'three';

    interface UpdateCountsData {
        phaseCounts: Record<string, number>;
        totalUnits: number;
        percentages: Record<string, number>;
        notStarted: number;
        notStartedPercentage: number;
    }

    export default defineComponent({
        name: 'App',
        components: {
            RhinoManagement,
            ThreeJSScene,
        },
        setup() {
            const fileName = ref<string | null>(null);
            const threeJSScene = ref<InstanceType<typeof ThreeJSScene> | null>(null);
            const isProductionTracking = ref(false);
            const modelLoaded = ref(false);
            const isDarkMode = ref(true);

            const dataLoaded = ref(false); // Indicates if Excel data has been loaded

            const totalUnits = ref<number>(0);
            const notStartedCount = ref<number>(0);
            const notStartedPercentage = ref<string>('0.00');

            const onFileUploaded = (name: string) => {
                fileName.value = name.replace(/\.3dm$/, '');
                console.log('File name received in App.vue without extension:', fileName.value);
            };

            const toggleTheme = () => {
                isDarkMode.value = !isDarkMode.value;
                if (threeJSScene.value) {
                    threeJSScene.value.toggleBackground(isDarkMode.value);
                }
            };

            // Initialize ProductionColorHandler to access colorMapping
            const productionColorHandler = new ProductionColorHandler(0);
            const productionColorMapping = ref<{ [label: string]: string }>({});

            // Convert THREE.Color to CSS color strings for use in the legend
            Object.keys(productionColorHandler.colorMapping).forEach((phase) => {
                const color = productionColorHandler.colorMapping[phase];
                productionColorMapping.value[phase] = `#${color.getHexString()}`;
            });

            const handleGeometryParsed = (objects: THREE.Object3D[]) => {
                if (threeJSScene.value && typeof threeJSScene.value.addObjectsToScene === 'function') {
                    threeJSScene.value.addObjectsToScene(objects);
                }
                modelLoaded.value = true;
            };

            const toggleMode = () => {
                console.log('Toggling Production Mode. isProductionTracking:', isProductionTracking.value);
                if (threeJSScene.value && typeof threeJSScene.value.toggleMode === 'function') {
                    threeJSScene.value.toggleMode(isProductionTracking.value);
                }
            };

            const handleExcelUpload = async (event: Event) => {
                console.log('handleExcelUpload triggered in App.vue');
                if (threeJSScene.value && typeof threeJSScene.value.handleExcelUpload === 'function') {
                    console.log('Calling handleExcelUpload in ThreeJSScene.vue...');
                    await threeJSScene.value.handleExcelUpload(event);
                    dataLoaded.value = true;
                }
            };

            const handleUpdateTotalUnits = (units: number) => {
                totalUnits.value = units;
            };

            // Watch for changes in isProductionTracking
            watch(isProductionTracking, (newVal) => {
                if (newVal && !dataLoaded.value) {
                    // Only initialize counts if data has not been loaded
                    initializeCounts();
                }
            });

            const phaseCounts = ref<Record<string, number>>({
                'Released': 0,
                'Milling Complete': 0,
                'Panel Assembly Started': 0,
                'Panel Assembly Complete': 0,
                'Panel Stored On Site': 0,
                'Panel Installed': 0,
                'Panel Turned Over': 0,
            });

            const initializeCounts = () => {
                phaseCounts.value = {
                    'Released': 0,
                    'Milling Complete': 0,
                    'Panel Assembly Started': 0,
                    'Panel Assembly Complete': 0,
                    'Panel Stored On Site': 0,
                    'Panel Installed': 0,
                    'Panel Turned Over': 0,
                };
                totalUnits.value = 0;
                notStartedCount.value = 0;
                notStartedPercentage.value = '0.00';
            };

            const getPhasePercentage = (label: string | number) => {
                const key = String(label);
                if (totalUnits.value > 0) {
                    const percentage = (phaseCounts.value[key] / totalUnits.value) * 100;
                    return percentage.toFixed(2);
                } else {
                    return '0.00';
                }
            };

            const updateCounts = (data: UpdateCountsData) => {
                phaseCounts.value = { ...data.phaseCounts };
                totalUnits.value = data.totalUnits;
                notStartedCount.value = data.notStarted;
                notStartedPercentage.value = data.notStartedPercentage.toFixed(2);
                console.log('Received data in updateCounts:', data);
                console.log('Total Units is now:', totalUnits.value);
            };

            return {
                fileName,
                onFileUploaded,
                threeJSScene,
                isProductionTracking,
                modelLoaded,
                handleGeometryParsed,
                toggleMode,
                handleExcelUpload,
                productionColorMapping,
                phaseCounts,
                totalUnits,
                notStartedCount,
                notStartedPercentage,
                getPhasePercentage,
                updateCounts,
                isDarkMode,
                toggleTheme,
                handleUpdateTotalUnits,
            };
        },
    });
</script>

<style>
    /* Same as previous styling */
    #app {
        display: flex;
        flex-direction: column;
        height: 100vh;
        margin: 0;
        padding: 0;
        overflow: hidden;
    }

    /* Style for the Rhino file name at the top center */
    .file-name-top {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 18px;
        font-weight: bold;
        color: #333;
        z-index: 1000; /* Ensure it's on top of other elements */
    }

    .mode-switch {
        position: absolute;
        top: 150px;
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
        margin-top: 5px;
    }

    input[type='checkbox'] {
        display: none;
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
            content: '';
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
        background-color: #2196f3;
    }

    .mode-text {
        font-size: 14px;
        color: #333;
        margin-bottom: 5px;
        width: 160px;
        text-align: center;
    }

    label[for='excelUpload'] {
        font-size: 16px;
        font-weight: bold;
        color: #333;
        margin-top: 5px;
        display: block;
    }

    div.excel-upload {
        position: absolute;
        bottom: 20px;
        right: 20px;
        z-index: 20;
        background-color: rgba(255, 255, 255, 0.8);
        padding: 10px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
        color: gray; /* Change text color to gray */
    }

    .color-legend {
        position: absolute;
        bottom: 20px;
        left: 20px;
        z-index: 20;
        background-color: rgba(255, 255, 255, 0.9);
        padding: 10px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
        font-size: 14px;
        color: #333;
    }

    .legend-item {
        display: flex;
        align-items: center;
        margin-bottom: 5px;
    }

    .color-box {
        width: 20px;
        height: 20px;
        margin-right: 10px;
        border-radius: 4px;
    }

    .legend-label {
        font-size: 14px;
        color: #333;
    }

    .toggle-theme {
        position: absolute;
        top: 20px;
        left: 20px;
        z-index: 10;
    }

    .logo-container {
        position: absolute;
        top: 20px;
        right: 20px;
        z-index: 100;
    }

    .logo {
        width: 200px; /* Adjust the size of the logo */
        height: auto;
    }
</style>
