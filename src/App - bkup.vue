<template>
    <div id="app">
        <RhinoManagement :onGeometryParsed="handleGeometryParsed" />
        <ThreeJSScene ref="threeJSScene" />
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
            console.log("Setup function is running");

            const threeJSScene = ref<InstanceType<typeof ThreeJSScene> | null>(null);

            // Define the handleGeometryParsed function
            const handleGeometryParsed = (objects: THREE.Object3D[]) => {
                console.log("handleGeometryParsed is called");
                if (threeJSScene.value && typeof threeJSScene.value.addObjectsToScene === 'function') {
                    threeJSScene.value.addObjectsToScene(objects);
                }
            };

            console.log("Returning from setup:", { threeJSScene, handleGeometryParsed });

            // Return the function so it can be used in the template
            return {
                threeJSScene,
                handleGeometryParsed,
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
</style>
