export class CanvasWorkerFramework {
    constructor(workerScriptUrl, poolSize = 4) {
        this.workerScriptUrl = workerScriptUrl;
        this.workerPool = new Map(); // Map to store worker instances
        this.taskQueue = []; // Queue to store tasks
        this.activeWorkers = new Set(); // Set to track active workers
        this.poolSize = poolSize;

        // Initialize the worker pool
        this.initializeWorkerPool();
    }

    // Initialize the worker pool with a specified size
    initializeWorkerPool() {
        for (let i = 0; i < this.poolSize; i++) {
            this.createWorker(i);
        }
    }

    // Create a new worker and add it to the pool
    createWorker(workerId) {
        const worker = new Worker(this.workerScriptUrl);
        worker.onmessage = this.handleWorkerResponse.bind(this, workerId);
        worker.onerror = this.handleWorkerError.bind(this, workerId);
        this.workerPool.set(workerId, worker);
    }

    // Handle the worker's response and resolve the associated task
    handleWorkerResponse(workerId, event) {
        const { imageData } = event.data;
        const [resolve] = this.taskQueue.shift(); // Retrieve the task from the queue

        queueMicroTask(() => resolve(imageData)); // Resolve the task using queueMicroTask

        this.activeWorkers.delete(workerId); // Mark the worker as idle
        this.processNextTask(workerId); // Process the next task in the queue
    }

    // Handle any errors that occur in the worker
    handleWorkerError(workerId, error) {
        console.error(`Worker ${workerId} encountered an error:`, error);
        this.terminateWorker(workerId);

        if (this.taskQueue.length > 0) {
            const [, reject] = this.taskQueue.shift(); // Retrieve and reject the task

            queueMicroTask(() => reject(error)); // Reject the task using queueMicroTask
        }
    }

    // Add a task to the queue and assign it to an available worker
    processCanvasTask(imageData, task, options = {}) {
        return new Promise((resolve, reject) => {
            this.taskQueue.push([resolve, reject, imageData, task, options]);
            this.assignTaskToWorker();
        });
    }

    // Assign the next task in the queue to an available worker
    assignTaskToWorker() {
        for (let [workerId, worker] of this.workerPool.entries()) {
            if (!this.activeWorkers.has(workerId) && this.taskQueue.length > 0) {
                this.processNextTask(workerId); // Delegate task to an idle worker
                break; // Exit the loop after assigning one task
            }
        }
    }

    // Process the next task in the queue for the specified worker
    processNextTask(workerId) {
        if (this.taskQueue.length > 0) {
            const [, , imageData, task, options] = this.taskQueue[0]; // Peek at the next task
            const worker = this.workerPool.get(workerId);
            worker.postMessage({ imageData, task, options }); // Send task to the worker
            this.activeWorkers.add(workerId); // Mark the worker as active
        }
    }

    // Terminate the specified worker and remove it from the pool
    terminateWorker(workerId) {
        const worker = this.workerPool.get(workerId);
        if (worker) {
            worker.terminate();
            this.workerPool.delete(workerId); // Remove worker from the pool
        }
    }
}
