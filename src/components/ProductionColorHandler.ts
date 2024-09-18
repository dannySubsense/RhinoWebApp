import * as THREE from 'three';

export class ProductionColorHandler {
    public colorMapping: { [phase: string]: THREE.Color } = {
        "Released": new THREE.Color(0xFFA500), // Orange
        "Milling Complete": new THREE.Color(0xE0B0FF), // Mauve
        "Panel Assembly Started": new THREE.Color(0xFF00FF), // Magenta
        "Panel Assembly Complete": new THREE.Color(0x008000), // Green
        "Panel Stored On Site": new THREE.Color(0x20B2AA), // Light Sea Green
        "Panel Installed": new THREE.Color(0x00FFFF), // Cyan
        "Panel Turned Over": new THREE.Color(0x0000FF), // Blue
    };

    public phaseCounts: { [phase: string]: number } = {
        "Released": 0,
        "Milling Complete": 0,
        "Panel Assembly Started": 0,
        "Panel Assembly Complete": 0,
        "Panel Stored On Site": 0,
        "Panel Installed": 0,
        "Panel Turned Over": 0,
    };

    public totalUnits: number = 0;
    public notStarted: number = 0;

    public applyProductionColors(parsedData: any[], scene: THREE.Scene, totalUnits?: number) {
        this.resetCounts();
        this.totalUnits = totalUnits !== undefined ? totalUnits : this.totalUnits;

        parsedData.forEach(entry => {
            const pid = entry.PID;
            const reachedPhases = this.getAllReachedPhases(entry);

            reachedPhases.forEach(phase => {
                this.phaseCounts[phase] += 1;
            });

            const mostAdvancedPhase = reachedPhases[reachedPhases.length - 1];
            const color = mostAdvancedPhase ? this.colorMapping[mostAdvancedPhase] : null;
            scene.traverse((object: any) => {
                if (object.userData?.attributes?.userStrings) {
                    const pidValue = object.userData.attributes.userStrings.find((str: [string, string]) => str[0] === 'PID')?.[1];
                    if (pidValue === pid) {
                        object.userData.attributes.productionTrackingColor = color;
                        object.userData.attributes.productionTrackingPhase = mostAdvancedPhase || "Not Started";
                        if (object.material && object.material.color && color) {
                            object.material.color.copy(color);
                        }
                    }
                }
            });
        });


        // Calculate "Not Started" units
        const unitsWithPhases = new Set(parsedData.map(entry => entry.PID));
        this.notStarted = this.totalUnits - unitsWithPhases.size;
    }

    constructor(totalUnits: number) {
        this.totalUnits = totalUnits;
        this.resetCounts();
    }


    private resetCounts() {
        // this.totalUnits = 0; // Remove this line
        this.notStarted = 0;
        Object.keys(this.phaseCounts).forEach(phase => {
            this.phaseCounts[phase] = 0;
        });
    }


    private getAllReachedPhases(entry: any): string[] {
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




    public getPercentages() {
        const percentages: { [phase: string]: number } = {};

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