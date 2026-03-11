/**
 * TaskQueue - Priority-based FIFO task queue
 * Supports priority levels: critical (0), high (1), normal (2), low (3).
 *
 * @module lib/team/task-queue
 */

/** @enum {number} */
const PRIORITY = {
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3
};

class TaskQueue {
  constructor() {
    /** @type {Array<{ task: object, priority: number, enqueuedAt: string }>} */
    this._queue = [];
  }

  /**
   * Add a task to the queue with priority ordering
   * @param {object} task - Task object
   * @param {number} [priority=2] - Priority level (0=critical, 1=high, 2=normal, 3=low)
   * @returns {number} New queue size
   */
  enqueue(task, priority = PRIORITY.NORMAL) {
    const entry = {
      task,
      priority: typeof priority === 'number' ? priority : PRIORITY.NORMAL,
      enqueuedAt: new Date().toISOString()
    };

    // Insert in priority order (lower number = higher priority)
    const insertIdx = this._queue.findIndex(e => e.priority > entry.priority);
    if (insertIdx === -1) {
      this._queue.push(entry);
    } else {
      this._queue.splice(insertIdx, 0, entry);
    }

    return this._queue.length;
  }

  /**
   * Remove and return the highest-priority task
   * @returns {object|null} Task object or null if queue is empty
   */
  dequeue() {
    if (this._queue.length === 0) return null;
    return this._queue.shift().task;
  }

  /**
   * View the highest-priority task without removing it
   * @returns {object|null} Task object or null if queue is empty
   */
  peek() {
    if (this._queue.length === 0) return null;
    return this._queue[0].task;
  }

  /**
   * Get current queue size
   * @returns {number}
   */
  size() {
    return this._queue.length;
  }

  /**
   * Remove all tasks from the queue
   */
  clear() {
    this._queue = [];
  }

  /**
   * Get all tasks as an array (for inspection)
   * @returns {object[]}
   */
  toArray() {
    return this._queue.map(e => ({
      ...e.task,
      _priority: e.priority,
      _enqueuedAt: e.enqueuedAt
    }));
  }
}

module.exports = TaskQueue;
module.exports.PRIORITY = PRIORITY;
