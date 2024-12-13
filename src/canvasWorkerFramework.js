export class CanvasWorkerFramework {
  #workerPool = new Map();
  #taskQueue = [];
  #activeWorkers = new Set();

  constructor(workerScriptUrl, poolSize = 4) {
    this.#initializeWorkerPool(workerScriptUrl, poolSize);
  }

  #initializeWorkerPool(workerScriptUrl, poolSize) {
    for (let i = 0; i < poolSize; i++) {
      this.#createWorker(workerScriptUrl, i);
    }
  }

  #createWorker(workerScriptUrl, workerId) {
    const worker = new Worker(new URL(workerScriptUrl, import.meta.url), {
      type: "module",
    });

    worker.onmessage = ({ data: { imageData } }) => {
      const [resolve] = this.#taskQueue.shift();
      resolve(imageData);
      this.#activeWorkers.delete(workerId);
      this.#processNextTask(workerId);
    };

    worker.onerror = (error) => {
      console.error("Worker Error:", error);
      this.#terminateWorker(workerId);

      if (this.#taskQueue.length) {
        const [, reject] = this.#taskQueue.shift();
        reject(error);
      }
    };

    this.#workerPool.set(workerId, worker);
  }

  async processCanvasTask(imageData, task, options = {}) {
    return new Promise((resolve, reject) => {
      this.#taskQueue.push([resolve, reject, imageData, task, options]);
      this.#assignTaskToWorker();
    });
  }

  #assignTaskToWorker() {
    const availableWorker = Array.from(this.#workerPool.entries()).find(
      ([workerId]) => !this.#activeWorkers.has(workerId)
    );

    if (availableWorker && this.#taskQueue.length) {
      this.#processNextTask(availableWorker[0]);
    }
  }

  #processNextTask(workerId) {
    if (!this.#taskQueue.length) return;

    const [, , imageData, task, options] = this.#taskQueue[0];
    const worker = this.#workerPool.get(workerId);

    worker.postMessage({ imageData, task, payload: options });
    this.#activeWorkers.add(workerId);
  }

  #terminateWorker(workerId) {
    const worker = this.#workerPool.get(workerId);
    if (worker) {
      worker.terminate();
      this.#workerPool.delete(workerId);
    }
  }
}
