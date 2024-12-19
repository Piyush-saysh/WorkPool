
//    const WorkerPool = require('./workerPool2'); 


//    const pool = new WorkerPool(3, true);


//    const createTask = (id, duration) => {
//      return () => new Promise((resolve) => {
//        setTimeout(() => {
//          console.log(`Task ${id} completed`);
//          resolve(`Result of task ${id}`);
//        }, duration);
//      });
//    };


//    for (let i = 1; i <= 10; i++) {
//      pool.addTask(createTask(i, Math.random() * 2000 + 1000), Math.floor(Math.random() * 10), 3000, 2); 
//    }

//    pool.on('taskCompleted', ({ id, result }) => {
//      console.log(`Task ${id} completed with result: ${result}`);
//    });

//    pool.on('taskError', ({ id, error }) => {
//      console.error(`Task ${id} encountered an error: ${error.message}`);
//    });

//    pool.on('taskTimeout', ({ id }) => {
//      console.warn(`Task ${id} has timed out.`);
//    });


//    setTimeout(() => {
//      pool.cancelTask(3); 
//    }, 500); 


//    setTimeout(async () => {
//      await pool.shutdown(); 
//    }, 10000); 
const WorkerPool = require('./workerPool2'); // Assuming the class is in workerPool.js

// Create an instance of WorkerPool with 3 workers and debug enabled
const pool = new WorkerPool(3, true);

// Function to create a task with a unique ID and execution duration
const createTask = (id, duration) => {
  return () =>
    new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Task ${id} completed`);
        resolve(`Result of task ${id}`);
      }, duration);
    });
};

// Add tasks to the worker pool with random priorities and timeout
for (let i = 1; i <= 10; i++) {
  pool.addTask(createTask(i, Math.random() * 2000 + 1000), Math.floor(Math.random() * 10), 3000, 2)
    .then(result => console.log(`Task ${i}: ${result}`))
    .catch(error => console.error(`Task ${i}: ${error.message}`));
}

// Event listeners for task lifecycle events
pool.on('taskCompleted', ({ id, result }) => console.log(`[Event] Task ${id} completed with result: ${result}`));
pool.on('taskError', ({ id, error }) => console.error(`[Event] Task ${id} encountered an error: ${error.message}`));
pool.on('taskTimeout', ({ id }) => console.warn(`[Event] Task ${id} timed out.`));
pool.on('taskCanceled', ({ id }) => console.log(`[Event] Task ${id} was canceled.`));

// Cancel task 3 after 500ms
setTimeout(() => {
  console.log('Cancelling Task 3...');
  pool.cancelTask(3);
}, 500);

// Dynamically adjust the number of workers after 2 seconds
setTimeout(() => {
  console.log('Increasing workers to 5...');
  pool.setMaxWorkers(5);
}, 2000);

// Monitor progress every second
const progressInterval = setInterval(() => {
  const progress = pool.getProgress();
  console.log(`Progress: Completed - ${progress.completedTasks}, Pending - ${progress.pendingTasks}`);
  if (progress.pendingTasks === 0) clearInterval(progressInterval); // Stop logging when all tasks are done
}, 1000);

// Gracefully shut down the pool after 10 seconds
setTimeout(async () => {
  console.log('Initiating shutdown...');
  await pool.shutdown();
  console.log('All tasks completed. WorkerPool is shut down.');
}, 10000);
