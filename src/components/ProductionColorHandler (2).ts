import * as THREE from 'three';

export class ProductionColorHandler {
    private colorMapping: { [phase: string]: THREE.Color } = {
        "Released": new THREE.Color(0xffcc00), // Yellow
        "Assembly Started": new THREE.Color(0xff9900), // Orange
        "Assembly Finished": new THREE.Color(0x33cc33), // Green
        "Crated": new THREE.Color(0x3366ff), // Blue
        "On Site": new THREE.Color(0x9900cc), // Purple
        "Installed": new THREE.Color(0x0099cc) // Teal
    };

    private phaseCounts: { [phase: string]: number } = {
        "Released": 0,
        "Assembly Started": 0,
        "Assembly Finished": 0,
        "Crated": 0,
        "On Site": 0,
        "Installed": 0       
    };

    private totalUnits: number = 0; // Track the total number of PIDs

    public applyProductionColors(parsedData: any[], scene: THREE.Scene) {
        this.resetCounts(); // Reset counts before recalculating

        const totalPIDs = parsedData.length;
        this.totalUnits = totalPIDs; // Set total units from the Excel data
        console.log(`Total number of PIDs (Excel rows): ${totalPIDs}`);

        parsedData.forEach(entry => {
            const pid = entry.PID;
            console.log(`Processing PID: ${pid}`);

            const phase = this.determineCurrentPhase(entry); // Determine the phase

            if (phase) {
                this.phaseCounts[phase] += 1;
                console.log(`Phase: ${phase}, Updated Phase Count: ${this.phaseCounts[phase]}`);
            }

            const color = this.colorMapping[phase] || new THREE.Color(0x808080); // Default to gray

            // Traverse the scene and apply productionTrackingColor and productionTrackingPhase
            scene.traverse((object: any) => {
                if (object.userData?.attributes?.userStrings) {
                    const pidValue = object.userData.attributes.userStrings.find((str: [string, string]) => str[0] === 'PID')?.[1];
                    if (pidValue === pid) {
                        // Update the productionTrackingColor
                        object.userData.attributes.productionTrackingColor = color;

                        // Update the productionTrackingPhase
                        object.userData.attributes.productionTrackingPhase = phase || "Not Started";

                        // Apply the color to the material
                        if (object.material && object.material.color) {
                            object.material.color.copy(color);
                        }
                    }
                }
            });
        });

        console.log('Phase Counts:', this.phaseCounts);
        console.log('Total Units:', this.totalUnits);
    }


    private resetCounts() {
        this.totalUnits = 0; // Reset the total number of PIDs
        Object.keys(this.phaseCounts).forEach(phase => {
            this.phaseCounts[phase] = 0;
        });
    }

    public getPhaseCounts() {
        return this.phaseCounts;
    }

    public getTotalUnits() {
        return this.totalUnits;
    }

    public determineCurrentPhase(entry: any): string {
        if (entry.Installed) return "Installed";
        if (entry.OnSite) return "On Site";
        if (entry.Crated) return "Crated";
        if (entry.AssemblyFinished) return "Assembly Finished";
        if (entry.AssemblyStarted) return "Assembly Started";
        if (entry.Released) return "Released";
        return "";
    }
}
