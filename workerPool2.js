const { EventEmitter } = require('events');

class WorkerPool extends EventEmitter {
  constructor(maxWorkers, debug = false) {
    super();
    this.maxWorkers = maxWorkers;
    this.taskQueue = [];
    this.activeWorkers = 0;
    this.taskIdCounter = 0;
    this.results = new Map();
    this.isShuttingDown = false;
    this.debug = debug;
    this.isAcceptingTasks = true;

  }

  log(message) {
    if (this.debug) {
      console.log(`[WorkerPool] ${message}`);
    }
  }

  addTask(task, priority = 0, timeout = 5000, retries = 0) {
    return new Promise((resolve, reject) => {
        if (!this.isAcceptingTasks) {
          return reject(new Error('Worker pool has stopped accepting new tasks.'));
        }
      const taskId = this.taskIdCounter++;
      this.taskQueue.push({
        task,
        resolve,
        reject,
        priority,
        id: taskId,
        timeout,
        retries,
        attempts: 0,
      });
      this.taskQueue.sort((a, b) => b.priority - a.priority); 
      this.runNext();
    });
  }

  async runNext() {
   
    if (this.activeWorkers < this.maxWorkers && this.taskQueue.length > 0) {
        const { task, resolve, reject, id, timeout, retries, attempts, priority } = this.taskQueue.shift(); 
        this.activeWorkers++;
        this.log(`Running task ${id} with priority ${priority}`); 
  
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            this.emit('taskTimeout', { id });
            reject(new Error(`Task ${id} timed out`));
          }, timeout);
        });

      try {
        const result = await Promise.race([task(), timeoutPromise]);
        this.results.set(id, result);
        this.emit('taskCompleted', { id, result });
        resolve(result);
      } catch (error) {
        if (attempts < retries) {
          this.taskQueue.unshift({ task, resolve, reject, priority, id, timeout, retries, attempts: attempts + 1 });
          this.taskQueue.sort((a, b) => b.priority - a.priority);
          this.log(`Retrying task ${id}, attempt ${attempts + 1}`);
        } else {
          this.emit('taskError', { id, error });
          reject(error);
        }
      } finally {
        this.activeWorkers--;
        this.runNext();
      }
    }
  }

  cancelTask(taskId) {
    const index = this.taskQueue.findIndex(task => task.id === taskId);
    if (index !== -1) {
      this.taskQueue.splice(index, 1);
      this.emit('taskCanceled', { id: taskId });
      this.log(`Task ${taskId} has been canceled.`);
    } else {
      this.log(`Task ${taskId} not found in the queue.`);
    }
  }

  async shutdown() {
    this.isShuttingDown = true;
    this.isAcceptingTasks = false;
    this.log('Shutting down...');
    this.taskQueue.sort((a, b) => a.priority - b.priority); 

    while (this.activeWorkers > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    while (this.taskQueue.length > 0) {
      const { reject, id } = this.taskQueue.shift();
      reject(new Error(`Task ${id} was canceled due to shutdown.`));
      this.emit('taskCanceled', { id });
    }

    this.log('Worker pool has been shut down gracefully.');
  }

  setMaxWorkers(newMax) {
    if (newMax < 1) throw new Error('maxWorkers must be at least 1.');
    this.maxWorkers = newMax;
    this.log(`Max workers set to ${newMax}`);
    this.runNext();
  }

  getQueue() {
    return this.taskQueue.map(({ id, priority }) => ({ id, priority }));
  }

  getProgress() {
    const completedTasks = this.results.size;
    const pendingTasks = this.taskQueue.length + this.activeWorkers;

    return {
      completedTasks,
      pendingTasks,
      totalTasks: completedTasks + pendingTasks,
    };
  }

  getResult(taskId) {
    return this.results.get(taskId);
  }
}


const pool = new WorkerPool(3, true);

const createTask = (id, duration) => {
  return () =>
    new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Task ${id} completed`);
        resolve(`Result of task ${id}`);
      }, duration);
    });
};


for (let i = 1; i <= 10; i++) {
  pool.addTask(createTask(i, Math.random() * 2000 + 1000), Math.floor(Math.random() * 10), 3000, 2);
}


pool.on('taskCompleted', ({ id, result }) => console.log(`Task ${id} completed with result: ${result}`));
pool.on('taskError', ({ id, error }) => console.error(`Task ${id} encountered an error: ${error.message}`));
pool.on('taskTimeout', ({ id }) => console.warn(`Task ${id} has timed out.`));
pool.on('taskCanceled', ({ id }) => console.log(`Task ${id} was canceled.`));


setTimeout(() => pool.cancelTask(3), 500);


setTimeout(() => pool.setMaxWorkers(5), 2000);


setInterval(() => console.log(pool.getProgress()), 1000);


setTimeout(async () => {
  await pool.shutdown();
}, 10000);

module.exports = WorkerPool;
