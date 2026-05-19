export type Semaphore = {
  acquire: () => Promise<() => void>;
};

export function createSemaphore(maxConcurrency: number): Semaphore {
  let active = 0;
  const queue: Array<() => void> = [];

  const acquire = () =>
    new Promise<() => void>((resolve) => {
      const tryAcquire = () => {
        if (active < maxConcurrency) {
          active += 1;
          resolve(() => {
            active = Math.max(0, active - 1);
            const next = queue.shift();
            if (next) next();
          });
          return;
        }
        queue.push(tryAcquire);
      };

      tryAcquire();
    });

  return { acquire };
}
