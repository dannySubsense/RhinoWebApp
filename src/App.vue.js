import { defineComponent, ref, computed } from 'vue';
import RhinoManagement from './components/RhinoManagement.vue';
import ThreeJSScene from './components/ThreeJSScene.vue';
import { ProductionColorHandler } from './components/ProductionColorHandler';
export default defineComponent({
    name: 'App',
    components: {
        RhinoManagement,
        ThreeJSScene,
    },
    setup() {
        const fileName = ref(null); // File name state
        const threeJSScene = ref(null);
        const isProductionTracking = ref(false);
        const modelLoaded = ref(false);
        const isDarkMode = ref(true); // Start with dark mode
        // Method to handle file upload event
        const onFileUploaded = (name) => {
            // Remove the .3dm extension from the file name
            fileName.value = name.replace(/\.3dm$/, '');
            console.log('File name received in App.vue without extension:', fileName.value);
        };
        const toggleTheme = () => {
            isDarkMode.value = !isDarkMode.value;
            // Make sure the threeJSScene ref is populated before trying to access it
            if (threeJSScene.value) {
                threeJSScene.value.toggleBackground(isDarkMode.value); // Call the toggleBackground method
            }
        };
        // Instantiate ProductionColorHandler to get colors and labels
        const productionColorHandler = new ProductionColorHandler();
        const productionColorMapping = ref({});
        // Convert THREE.Color to CSS color strings for use in the legend
        Object.keys(productionColorHandler['colorMapping']).forEach(phase => {
            const color = productionColorHandler['colorMapping'][phase];
            productionColorMapping.value[phase] = `#${color.getHexString()}`;
        });
        const handleGeometryParsed = (objects) => {
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
        const handleExcelUpload = async (event) => {
            console.log('handleExcelUpload triggered in App.vue');
            if (threeJSScene.value && typeof threeJSScene.value.handleExcelUpload === 'function') {
                console.log('Calling handleExcelUpload in ThreeJSScene.vue...');
                await threeJSScene.value.handleExcelUpload(event); // Let ThreeJSScene handle the file upload
            }
            else {
                console.log('threeJSScene.value is null or handleExcelUpload is not a function');
            }
        };
        const updateCounts = (newPhaseCounts, newTotalUnits) => {
            console.log('Updating counts after production colors are applied...');
            phaseCounts.value = { ...newPhaseCounts }; // Update reactive phaseCounts
            totalUnits.value = newTotalUnits;
            console.log('Phase Counts updated:', phaseCounts.value);
            console.log('Total Units updated:', totalUnits.value);
        };
        // Unit counts and percentages - initialize to 0 for all phases
        const phaseCounts = ref({
            "Released": 0,
            "Assembly Started": 0,
            "Assembly Finished": 0,
            "Crated": 0,
            "On Site": 0,
            "Installed": 0
        });
        const totalUnits = ref(0);
        const notStartedCount = computed(() => totalUnits.value - Object.values(phaseCounts.value).reduce((a, b) => a + b, 0));
        const notStartedPercentage = computed(() => totalUnits.value > 0 ? ((notStartedCount.value / totalUnits.value) * 100).toFixed(2) : 0);
        const getPhasePercentage = (label) => {
            return totalUnits.value > 0 ? ((phaseCounts.value[label] / totalUnits.value) * 100).toFixed(2) : '0';
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
        };
    },
});
;
function __VLS_template() {
    const __VLS_ctx = {};
    const __VLS_localComponents = {
        ...{
            RhinoManagement,
            ThreeJSScene,
        },
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
    // CSS variable injection 
    // CSS variable injection end 
    let __VLS_resolvedLocalAndGlobalComponents;
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ id: ("app"), });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("logo-container") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.img)({ src: ("./assets/IEF_Logo_Right_Isolated.png"), alt: ("Logo"), ...{ class: ("logo") }, });
    if (__VLS_ctx.fileName) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("file-name-top") }, });
        (__VLS_ctx.fileName);
    }
    const __VLS_0 = __VLS_resolvedLocalAndGlobalComponents.RhinoManagement;
    /** @type { [typeof __VLS_components.RhinoManagement, ] } */
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({ ...{ 'onFileUploaded': {} }, ...{ 'onGeometryParsed': {} }, isProductionTracking: ((__VLS_ctx.isProductionTracking)), }));
    const __VLS_2 = __VLS_1({ ...{ 'onFileUploaded': {} }, ...{ 'onGeometryParsed': {} }, isProductionTracking: ((__VLS_ctx.isProductionTracking)), }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_6;
    const __VLS_7 = {
        onFileUploaded: (__VLS_ctx.onFileUploaded)
    };
    const __VLS_8 = {
        onGeometryParsed: (__VLS_ctx.handleGeometryParsed)
    };
    let __VLS_3;
    let __VLS_4;
    const __VLS_5 = __VLS_pickFunctionalComponentCtx(__VLS_0, __VLS_2);
    if (__VLS_ctx.modelLoaded) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("mode-switch") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({ ...{ class: ("toggle-label") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("mode-text") }, });
        (__VLS_ctx.isProductionTracking ? 'Production Tracking' : 'Wireframe Model');
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("switch-container") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({ ...{ onChange: (__VLS_ctx.toggleMode) }, type: ("checkbox"), });
        (__VLS_ctx.isProductionTracking);
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("slider") }, });
    }
    if (__VLS_ctx.isProductionTracking) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("excel-upload") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({ for: ("excelUpload"), });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input, __VLS_intrinsicElements.input)({ ...{ onChange: (__VLS_ctx.handleExcelUpload) }, type: ("file"), id: ("excelUpload"), accept: (".xlsx"), });
    }
    if (__VLS_ctx.isProductionTracking) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("color-legend") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("legend-item") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("color-box") }, ...{ style: ({}) }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("legend-label") }, });
        (__VLS_ctx.notStartedCount);
        (__VLS_ctx.notStartedPercentage);
        for (const [color, label] of __VLS_getVForSourceType((__VLS_ctx.productionColorMapping))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ key: ((label)), ...{ class: ("legend-item") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("color-box") }, ...{ style: (({ backgroundColor: color })) }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("legend-label") }, });
            (label.toString());
            (__VLS_ctx.phaseCounts[label] || 0);
            (__VLS_ctx.getPhasePercentage(label.toString()));
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("total-units") }, });
        (__VLS_ctx.totalUnits);
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("toggle-theme") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (__VLS_ctx.toggleTheme) }, });
    (__VLS_ctx.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    const __VLS_9 = __VLS_resolvedLocalAndGlobalComponents.ThreeJSScene;
    /** @type { [typeof __VLS_components.ThreeJSScene, ] } */
    // @ts-ignore
    const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({ ...{ 'onUpdateCounts': {} }, ...{ 'onHandleExcelUpload': {} }, ref: ("threeJSScene"), isProductionTracking: ((__VLS_ctx.isProductionTracking)), }));
    const __VLS_11 = __VLS_10({ ...{ 'onUpdateCounts': {} }, ...{ 'onHandleExcelUpload': {} }, ref: ("threeJSScene"), isProductionTracking: ((__VLS_ctx.isProductionTracking)), }, ...__VLS_functionalComponentArgsRest(__VLS_10));
    // @ts-ignore navigation for `const threeJSScene = ref()`
    __VLS_ctx.threeJSScene;
    var __VLS_15 = {};
    let __VLS_16;
    const __VLS_17 = {
        onUpdateCounts: (__VLS_ctx.updateCounts)
    };
    const __VLS_18 = {
        onHandleExcelUpload: (__VLS_ctx.handleExcelUpload)
    };
    let __VLS_12;
    let __VLS_13;
    const __VLS_14 = __VLS_pickFunctionalComponentCtx(__VLS_9, __VLS_11);
    __VLS_styleScopedClasses['logo-container'];
    __VLS_styleScopedClasses['logo'];
    __VLS_styleScopedClasses['file-name-top'];
    __VLS_styleScopedClasses['mode-switch'];
    __VLS_styleScopedClasses['toggle-label'];
    __VLS_styleScopedClasses['mode-text'];
    __VLS_styleScopedClasses['switch-container'];
    __VLS_styleScopedClasses['slider'];
    __VLS_styleScopedClasses['excel-upload'];
    __VLS_styleScopedClasses['color-legend'];
    __VLS_styleScopedClasses['legend-item'];
    __VLS_styleScopedClasses['color-box'];
    __VLS_styleScopedClasses['legend-label'];
    __VLS_styleScopedClasses['legend-item'];
    __VLS_styleScopedClasses['color-box'];
    __VLS_styleScopedClasses['legend-label'];
    __VLS_styleScopedClasses['total-units'];
    __VLS_styleScopedClasses['toggle-theme'];
    var __VLS_slots;
    var __VLS_inheritedAttrs;
    const __VLS_refs = {
        "threeJSScene": __VLS_15,
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
//# sourceMappingURL=App.vue.js.map