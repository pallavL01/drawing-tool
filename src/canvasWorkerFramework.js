export class CanvasWorkerFramework {
  constructor(workerScriptUrl, poolSize = 4) {
    this.workerPool = new Map();
    this.taskQueue = [];
    this.activeWorkers = new Set();
    this.poolSize = poolSize;

    // Initialize the worker pool
    for (let i = 0; i < poolSize; i++) {
      this.createWorker(workerScriptUrl, i);
    }
  }

  createWorker(workerScriptUrl, workerId) {
    try {
      const worker = new Worker(new URL(workerScriptUrl, import.meta.url), {
        type: "module",
      });
      worker.onmessage = this.handleWorkerResponse.bind(this, workerId);
      worker.onerror = this.handleWorkerError.bind(this, workerId);
      this.workerPool.set(workerId, worker);
      console.log(`Worker ${workerId} created successfully.`);
    } catch (error) {
      console.error(`Failed to create worker ${workerId}:`, error);
    }
  }

  handleWorkerResponse(workerId, event) {
    const { imageData, result } = event.data;
    const [resolve] = this.taskQueue.shift();

    if (imageData) {
      resolve(imageData);
    } else if (result) {
      resolve(result);
    } else {
      console.error(`Worker ${workerId} returned unknown data type.`);
    }

    this.activeWorkers.delete(workerId);
    this.processNextTask(workerId);
  }

  handleWorkerError(workerId, error) {
    console.error(`Worker ${workerId} Error:`, error);
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
    const worker = this.workerPool.get(workerId);
    if (worker) {
      worker.terminate();
      this.workerPool.delete(workerId);
      console.log(`Worker ${workerId} terminated.`);
    }
  }
}
