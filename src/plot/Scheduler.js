// Minimal rAF-coalescing scheduler for v3.1 plots. Can drive WebGL renders and
// deferred jobs without tying into existing wiring yet.
export class Scheduler {
  constructor(renderEvent) {
    this.renderEvent = renderEvent || null;
    this.dirty = false;
    this.jobs = new Map();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  markDirty() {
    this.dirty = true;
  }

  scheduleJob(key, fn) {
    if (!key || !fn) return;
    this.jobs.set(key, fn);
  }

  _loop() {
    if (this.dirty && this.renderEvent) {
      this.dirty = false;
      this.renderEvent.state = { redraw: true };
    }

    if (this.jobs.size) {
      const pending = Array.from(this.jobs.entries());
      this.jobs.clear();
      pending.forEach(([, fn]) => fn());
    }

    requestAnimationFrame(this._loop);
  }
}
