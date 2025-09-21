/**
 * Job Monitoring Service
 * Monitors background job performance and health
 */
class JobMonitoringService {
  constructor() {
    this.jobStats = new Map();
  }

  // Record job execution
  recordJobExecution(
    jobName,
    startTime,
    endTime,
    success,
    recordsProcessed = 0,
    errors = 0
  ) {
    const duration = endTime - startTime;
    const stats = this.jobStats.get(jobName) || {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      totalDuration: 0,
      totalRecordsProcessed: 0,
      totalErrors: 0,
      lastRun: null,
      averageDuration: 0,
    };

    stats.totalRuns++;
    stats.totalDuration += duration;
    stats.totalRecordsProcessed += recordsProcessed;
    stats.totalErrors += errors;
    stats.lastRun = endTime;
    stats.averageDuration = stats.totalDuration / stats.totalRuns;

    if (success) {
      stats.successfulRuns++;
    } else {
      stats.failedRuns++;
    }

    this.jobStats.set(jobName, stats);

    // Log performance metrics
    console.log(
      `📊 Job ${jobName} completed in ${duration}ms - Records: ${recordsProcessed}, Errors: ${errors}`
    );

    // Alert on performance issues
    if (duration > 30000) {
      // 30 seconds
      console.warn(
        `⚠️ Job ${jobName} took ${duration}ms - consider optimization`
      );
    }
  }

  // Get job statistics
  getJobStats(jobName) {
    return this.jobStats.get(jobName);
  }

  // Get all job statistics
  getAllJobStats() {
    return Object.fromEntries(this.jobStats);
  }

  // Check if jobs are healthy
  getHealthStatus() {
    const now = Date.now();
    const health = {};

    for (const [jobName, stats] of this.jobStats) {
      const timeSinceLastRun = now - (stats.lastRun || 0);
      const successRate =
        stats.totalRuns > 0
          ? (stats.successfulRuns / stats.totalRuns) * 100
          : 0;

      health[jobName] = {
        isHealthy: successRate >= 95 && timeSinceLastRun < 3600000, // 1 hour
        successRate: successRate.toFixed(2),
        timeSinceLastRun: timeSinceLastRun,
        averageDuration: stats.averageDuration,
      };
    }

    return health;
  }
}

module.exports = new JobMonitoringService();
