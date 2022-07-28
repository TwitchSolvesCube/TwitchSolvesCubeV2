import { player } from "./cube";
  
export function spinCamera(options?: { numSpins?: number, durationMs: number }): void {
    const durationMs = options?.durationMs ?? 2000;
    const start = performance.now();
    const end = start + durationMs;
    let lastFraction = 0;
    const animFrame = async (now: number) => {
      if (now > end) {
        now = end;
      }
      const currentFraction = (now - start) / durationMs;
      const elapsed = smootherStep(currentFraction) - smootherStep(lastFraction);
      const deltaDegrees = 360 * (options?.numSpins ?? 2) * elapsed;
      player.cameraLongitude = (await player.experimentalModel.twistySceneModel.orbitCoordinates.get()).longitude + deltaDegrees;
      lastFraction = currentFraction;
      if (now !== end) {
        requestAnimationFrame(animFrame)
      }
    }
    requestAnimationFrame(animFrame);
}

function smootherStep(x: number): number {
    return x * x * x * (10 - x * (15 - 6 * x));
}
