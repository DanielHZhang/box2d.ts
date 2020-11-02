import { performance } from "./performance";

// Timer for profiling. This has platform specific code and may
// not work on every platform.
export class b2Timer {
    public m_start: number = performance.now();

    // Reset the timer.
    public Reset(): b2Timer {
        this.m_start = performance.now();
        return this;
    }

    // Get the time since construction or the last reset.
    public GetMilliseconds(): number {
        return performance.now() - this.m_start;
    }
}
