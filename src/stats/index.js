module.exports = class WorkloadStats {
    constructor(runConfig) {
        this.complete = 0;
        this.running = 0;
        this.errors = 0;
        this.runConfig = runConfig;
    }

    getState() {
        return {
            complete: this.complete,
            running: this.running,
            errors: this.errors,            
        };
    }

    errorSeen(err) {
        this.errors++;
        console.error(err);
    }

    internalError(err) {
        this.errors++;
        console.error(err);
    }

    startStrategy(d) {
        this.running++;
    }

    endStrategy(data) {
        this.running = this.running - 1;
        this.complete++;
        return data;
    }
};