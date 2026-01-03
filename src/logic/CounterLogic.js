export class CounterLogic {
    constructor(callbacks) {
        this.count = 0;
        this.sajdahCount = 0;
        this.callbacks = callbacks;
        this.lastTriggerTime = 0;
        this.COOLDOWN = 1500; // 1.5s between sajdahs
    }

    processSajdahTrigger() {
        const now = Date.now();
        if (now - this.lastTriggerTime < this.COOLDOWN) return;

        this.sajdahCount++;
        this.lastTriggerTime = now;

        if (this.callbacks.onSajdahDetect) {
            this.callbacks.onSajdahDetect(this.sajdahCount);
        }

        if (this.sajdahCount >= 2) {
            this.count++;
            this.sajdahCount = 0;
            if (this.callbacks.onCountChange) {
                this.callbacks.onCountChange(this.count);
            }
        }
    }

    reset() {
        this.count = 0;
        this.sajdahCount = 0;
        this.lastTriggerTime = 0;
    }
}
