# **WorkerPool - A Task Management System with Worker Pooling**

## **Overview**

**WorkPool** is a Node.js library designed to manage and execute asynchronous tasks with limited concurrency. It provides features such as task prioritization, retries, timeouts, and a graceful shutdown mechanism. With its event-driven design, **WorkPool** is an ideal choice for handling parallel workloads efficiently.

## **Features**

- **Task Queue**: Tasks are queued and processed in order of priority.
- **Worker Pooling**: A maximum number of workers can be configured to run tasks concurrently.
- **Task Retries**: Failed tasks can be retried up to a specified number of attempts.
- **Timeout Handling**: Each task can have a timeout, and tasks that exceed the timeout are automatically canceled.
- **Task Cancellation**: Tasks can be canceled individually.
- **Shutdown Support**: Graceful shutdown of the pool, ensuring all pending tasks are either completed or canceled.
- **Debug Mode**: Logs detailed information about the pool's operations when enabled.
