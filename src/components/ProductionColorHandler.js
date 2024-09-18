import * as THREE from 'three';
export class ProductionColorHandler {
    applyProductionColors(parsedData, scene, totalUnits) {
        this.resetCounts(); // Resets counts for each phase
        this.totalUnits = totalUnits !== undefined ? totalUnits : this.totalUnits;
        // Loop through parsed Excel data
        parsedData.forEach(entry => {
            const pid = entry.PID;
            const reachedPhases = this.getAllReachedPhases(entry);
            reachedPhases.forEach(phase => {
                this.phaseCounts[phase] += 1;
            });
            const mostAdvancedPhase = reachedPhases[reachedPhases.length - 1];
            const color = mostAdvancedPhase ? this.colorMapping[mostAdvancedPhase] : null;
            // Traverse the scene and apply the production color to matching objects
            scene.traverse((object) => {
                if (object.userData?.attributes?.userStrings) {
                    const pidValue = object.userData.attributes.userStrings.find((str) => str[0] === 'PID')?.[1];
                    if (pidValue === pid) {
                        if (color) {
                            // Update the productionTrackingColor only if we have a valid phase color
                            object.userData.attributes.productionTrackingColor = color;
                        }
                        else {
                            // If there's no phase color, set to gray if it's not already set
                            object.userData.attributes.productionTrackingColor = object.userData.attributes.productionTrackingColor || "#808080"; // Gray
                        }
                        object.userData.attributes.productionTrackingPhase = mostAdvancedPhase || "Not Started";
                        // Apply the productionTrackingColor to the material
                        if (object.material && object.material.color && object.userData.attributes.productionTrackingColor) {
                            const newColor = new THREE.Color(object.userData.attributes.productionTrackingColor);
                            object.material.color.copy(newColor);
                        }
                    }
                }
            });
        });
        // Calculate "Not Started" units
        const unitsWithPhases = new Set(parsedData.map(entry => entry.PID));
        this.notStarted = this.totalUnits - this.phaseCounts["Released"];
    }
    // this.notStarted = this.totalUnits - this.phaseCounts["Released"];
    constructor(totalUnits) {
        this.colorMapping = {
            "Released": new THREE.Color(0xFFA500), // Orange
            "Milling Complete": new THREE.Color(0xE0B0FF), // Mauve
            "Panel Assembly Started": new THREE.Color(0xFF00FF), // Magenta
            "Panel Assembly Complete": new THREE.Color(0x008000), // Green
            "Panel Stored On Site": new THREE.Color(0x20B2AA), // Light Sea Green
            "Panel Installed": new THREE.Color(0x00FFFF), // Cyan
            "Panel Turned Over": new THREE.Color(0x0000FF), // Blue
        };
        this.phaseCounts = {
            "Released": 0,
            "Milling Complete": 0,
            "Panel Assembly Started": 0,
            "Panel Assembly Complete": 0,
            "Panel Stored On Site": 0,
            "Panel Installed": 0,
            "Panel Turned Over": 0,
        };
        this.totalUnits = 0;
        this.notStarted = 0;
        this.totalUnits = totalUnits;
        this.resetCounts();
    }
    resetCounts() {
        // this.totalUnits = 0; // Remove this line
        this.notStarted = 0;
        Object.keys(this.phaseCounts).forEach(phase => {
            this.phaseCounts[phase] = 0;
        });
    }
    getAllReachedPhases(entry) {
        const phases = [];
        // List of phases to check
        const phaseColumns = [
            'Released',
            'Milling Complete',
            'Panel Assembly Started',
            'Panel Assembly Complete',
            'Panel Stored On Site',
            'Panel Installed',
            'Panel Turned Over',
        ];
        for (const phase of phaseColumns) {
            if (entry[phase] != null && entry[phase] !== '') {
                // If the cell has any value (not null or empty string), consider the phase reached
                phases.push(phase);
            }
        }
        return phases;
    }
    getPercentages() {
        const percentages = {};
        // Calculate percentages for each phase
        for (const phase of Object.keys(this.phaseCounts)) {
            percentages[phase] = this.totalUnits > 0 ? (this.phaseCounts[phase] / this.totalUnits) * 100 : 0;
        }
        // Calculate percentage for 'Not Started'
        const notStartedPercentage = this.totalUnits > 0 ? (this.notStarted / this.totalUnits) * 100 : 0;
        return {
            percentages,
            notStartedPercentage,
        };
    }
}
//# sourceMappingURL=ProductionColorHandler.js.map