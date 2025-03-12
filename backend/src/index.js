// Main entry point for the application
const cluster = require('cluster');
const master = require('./master');
const worker = require('./worker');
require('dotenv').config();

// Determine if this is the master process or a worker
if (cluster.isPrimary) {
  // Start the master process
  master();
} else {
  // Start a worker process
  worker();
}