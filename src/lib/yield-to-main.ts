/** 让出主线程，便于先绘制 loading 等 UI（改善 INP） */
export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });
}

/** 将重逻辑推迟到下一帧之后，避免阻塞 click/submit 的 INP */
export function deferAfterPaint(task: () => void): void {
  requestAnimationFrame(() => {
    setTimeout(task, 0);
  });
}
