import { spawn } from 'child_process';

const tasks = [
  { name: 'frontend', command: 'npm', args: ['--prefix', 'frontend', 'run', 'dev'] },
  { name: 'backend', command: 'npm', args: ['--prefix', 'backend', 'run', 'dev'] }
];

const children = [];
let shuttingDown = false;

const stop = (exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }

  process.exit(exitCode);
};

for (const task of tasks) {
  const child = spawn(task.command, task.args, {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  children.push(child);

  child.on('error', (error) => {
    console.error(`[${task.name}] failed to start:`, error.message);
    stop(1);
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;

    if (signal) {
      console.log(`[${task.name}] exited with signal ${signal}`);
      stop(1);
      return;
    }

    if (code !== 0) {
      console.log(`[${task.name}] exited with code ${code}`);
      stop(code ?? 1);
    }
  });
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));