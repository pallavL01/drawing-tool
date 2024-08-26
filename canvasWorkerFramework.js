// canvasWorkerFramework.js

export class CanvasWorkerFramework {
  constructor(workerScriptUrl, poolSize = 4) {
    this.workerScriptUrl = workerScriptUrl;
    this.workerPool = new Map();
    this.taskQueue = [];
    this.activeWorkers = new Set();
    this.poolSize = poolSize;

    // Initialize the worker pool
    for (let i = 0; i < poolSize; i++) {
      this.createWorker(i);
    }
  }

  createWorker(workerId) {
    const worker = new Worker(this.workerScriptUrl);
    worker.onmessage = this.handleWorkerResponse.bind(this, workerId);
    worker.onerror = this.handleWorkerError.bind(this, workerId);
    this.workerPool.set(workerId, worker);
  }

  handleWorkerResponse(workerId, event) {
    const { imageData } = event.data;
    const [resolve] = this.taskQueue.shift();
    resolve(imageData);

    this.activeWorkers.delete(workerId);
    this.processNextTask(workerId);
  }

  handleWorkerError(workerId, error) {
    console.error("Worker Error:", error);
    this.terminateWorker(workerId);

    if (this.taskQueue.length > 0) {
      const [, reject] = this.taskQueue.shift();
      reject(error);
    }
  }

  processCanvasTask(imageData, task, options = {}) {
    return new Promise((resolve, reject) => {
      this.taskQueue.push([resolve, reject, imageData, task, options]);
      this.assignTaskToWorker();
    });
  }

  assignTaskToWorker() {
    for (let [workerId, worker] of this.workerPool.entries()) {
      if (!this.activeWorkers.has(workerId) && this.taskQueue.length > 0) {
        const [, , imageData, task, options] = this.taskQueue[0];
        worker.postMessage({ imageData, task, options });
        this.activeWorkers.add(workerId);
        break;
      }
    }
  }

  processNextTask(workerId) {
    if (this.taskQueue.length > 0) {
      const [, , imageData, task, options] = this.taskQueue[0];
      const worker = this.workerPool.get(workerId);
      worker.postMessage({ imageData, task, options });
      this.activeWorkers.add(workerId);
    }
  }

  terminateWorker(workerId) {
    if (this.workerPool.has(workerId)) {
      const worker = this.workerPool.get(workerId);
      worker.terminate();
      this.workerPool.delete(workerId);
    }
  }
}
